const db = require("../config/db");

// Helper: Get employee info from logged-in user
const getEmployeeFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    if (!users.length) return null;
    const u = users[0];
    const [emps] = await db.promise().query("SELECT * FROM employees WHERE email = ? OR employee_id = ?", [u.email, u.login_id]);
    return emps.length ? emps[0] : null;
};

// Helper: compute effective status (Overdue if deadline passed and not Completed)
const computeStatus = (task) => {
    if (task.status === "Completed") return task;
    if (task.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(task.deadline);
        deadline.setHours(0, 0, 0, 0);
        if (deadline < today) return { ...task, status: "Overdue" };
    }
    return task;
};

// 1. POST /api/tasks — Create task (Admin / Manager)
const createTask = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        const assignedByName = emp ? `${emp.first_name} ${emp.last_name}` : "Admin";

        const { task_title, description, assigned_to, priority, deadline, department, project_id, start_date } = req.body;
        if (!task_title || !assigned_to || !deadline) {
            return res.status(400).json({ success: false, message: "Title, assigned employee, and due date are required." });
        }

        // Get department from assigned employee if not provided
        let dept = department;
        const [empRows] = await db.promise().query("SELECT department FROM employees WHERE employee_id = ?", [assigned_to]);
        const assigneeDept = empRows.length ? empRows[0].department : null;

        if (req.user.role === "Manager") {
            if (!emp || emp.department !== assigneeDept) {
                return res.status(403).json({ success: false, message: "Forbidden: Assignee must be in your department." });
            }
            dept = emp.department;
        } else if (!dept) {
            dept = assigneeDept;
        }

        const [result] = await db.promise().query(
            `INSERT INTO tasks (task_title, description, assigned_by, assigned_by_user_id, employee_id, department, priority, status, deadline, project_id, start_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
            [task_title, description || null, assignedByName, req.user.id, assigned_to, dept, priority || "Medium", deadline, project_id || null, start_date || new Date().toLocaleDateString('en-CA')]
        );

        // Generate task_id from insert ID
        const taskId = `TK${String(result.insertId).padStart(4, "0")}`;
        await db.promise().query("UPDATE tasks SET task_id = ? WHERE id = ?", [taskId, result.insertId]);

        // Retrieve recipient employee details (for email and notification)
        const [assigneeRows] = await db.promise().query(
            `SELECT e.email, e.first_name, u.id AS user_id 
             FROM employees e 
             LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email
             WHERE e.employee_id = ?`,
            [assigned_to]
        );

        if (assigneeRows.length > 0) {
            const assignee = assigneeRows[0];
            const taskUrl = `http://localhost:5173/employee/tasks`;

            // 1. Create database notification for UI bell
            const { createNotification } = require("./notificationController");
            await createNotification(
                assignee.user_id,
                "New Task Assigned",
                `You have been assigned a new task: "${task_title}" by ${assignedByName}. Due date: ${deadline}.`
            );

            // 2. Send Email alert
            const { sendEmail } = require("../utils/emailHelper");
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f7df0; margin-top: 0;">New Task Assigned</h2>
                    <p>Hello ${assignee.first_name || "Employee"},</p>
                    <p>You have been assigned a new task on Softspire.</p>
                    
                    <div style="background: #f8fafc; border-left: 4px solid #4f7df0; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <strong style="font-size: 16px;">${task_title}</strong>
                        <p style="margin: 8px 0 0 0; color: #475569;">${description || "No description provided."}</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 120px;">Task ID:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${taskId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Assigned By:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${assignedByName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Priority:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${priority || "Medium"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Due Date:</td>
                            <td style="padding: 6px 0; font-weight: 600; color: #ef4444;">${deadline}</td>
                        </tr>
                    </table>
                    
                    <a href="${taskUrl}" style="display: inline-block; background: #4f7df0; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">View Task Dashboard</a>
                    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">This is an automated message from Staffspire Solutions. Please do not reply.</p>
                </div>
            `;
            await sendEmail({
                to: assignee.email,
                subject: `[Task Assigned] ${task_title} (ID: ${taskId})`,
                html: emailHtml
            });
        }

        return res.status(201).json({ success: true, message: "Task created successfully.", taskId });
    } catch (error) {
        console.error("Create task error:", error);
        return res.status(500).json({ success: false, message: "Failed to create task." });
    }
};

// 2. GET /api/tasks — Get all tasks (Admin: all, Manager: department only)
const getAllTasks = async (req, res) => {
    try {
        const { status, priority, search, department } = req.query;
        const role = req.user.role;

        let where = "WHERE 1=1";
        const params = [];

        // Manager sees only their department
        if (role === "Manager") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) { where += " AND t.department = ?"; params.push(emp.department); }
        }

        if (status && status !== "all") {
            if (status === "Overdue") {
                where += " AND t.status NOT IN ('Completed') AND t.deadline < CURDATE()";
            } else {
                where += " AND t.status = ? AND NOT (t.status NOT IN ('Completed') AND t.deadline < CURDATE())";
                params.push(status);
            }
        }
        if (priority) { where += " AND t.priority = ?"; params.push(priority); }
        if (department && role === "Admin") { where += " AND t.department = ?"; params.push(department); }
        if (search) {
            where += " AND (t.task_title LIKE ? OR t.task_id LIKE ? OR CONCAT(e.first_name, ' ', e.last_name) LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [rows] = await db.promise().query(
            `SELECT t.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name
             FROM tasks t
             LEFT JOIN employees e ON t.employee_id = e.employee_id
             ${where}
             ORDER BY t.created_at DESC`,
            params
        );

        return res.status(200).json({ success: true, tasks: rows.map(computeStatus) });
    } catch (error) {
        console.error("Get all tasks error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch tasks." });
    }
};

// 3. GET /api/tasks/my — Get employee's own tasks
const getMyTasks = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: "Employee profile not found." });

        const { status } = req.query;
        let where = "WHERE employee_id = ?";
        const params = [emp.employee_id];

        if (status && status !== "all") {
            if (status === "Overdue") {
                where += " AND status NOT IN ('Completed') AND deadline < CURDATE()";
            } else {
                where += " AND status = ?";
                params.push(status);
            }
        }

        const [rows] = await db.promise().query(
            `SELECT * FROM tasks ${where} ORDER BY deadline ASC, created_at DESC`,
            params
        );

        return res.status(200).json({ success: true, tasks: rows.map(computeStatus) });
    } catch (error) {
        console.error("Get my tasks error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch tasks." });
    }
};

// 4. GET /api/tasks/stats — Stats for dashboard
const getTaskStats = async (req, res) => {
    try {
        const role = req.user.role;
        let baseWhere = "";
        const baseParams = [];

        if (role === "Manager") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) { baseWhere = "WHERE department = ?"; baseParams.push(emp.department); }
        } else if (role === "Employee") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) { baseWhere = "WHERE employee_id = ?"; baseParams.push(emp.employee_id); }
        }

        const and = baseWhere ? "AND" : "WHERE";

        const [[total]] = await db.promise().query(`SELECT COUNT(*) as c FROM tasks ${baseWhere}`, baseParams);
        const [[pending]] = await db.promise().query(`SELECT COUNT(*) as c FROM tasks ${baseWhere} ${and} status = 'Pending'`, baseParams);
        const [[inProgress]] = await db.promise().query(`SELECT COUNT(*) as c FROM tasks ${baseWhere} ${and} status = 'In Progress'`, baseParams);
        const [[onHold]] = await db.promise().query(`SELECT COUNT(*) as c FROM tasks ${baseWhere} ${and} status = 'On Hold'`, baseParams);
        const [[completed]] = await db.promise().query(`SELECT COUNT(*) as c FROM tasks ${baseWhere} ${and} status = 'Completed'`, baseParams);
        const [[overdue]] = await db.promise().query(
            `SELECT COUNT(*) as c FROM tasks ${baseWhere} ${and} status NOT IN ('Completed') AND deadline < CURDATE()`,
            baseParams
        );

        return res.status(200).json({
            success: true,
            stats: {
                total: total.c,
                pending: pending.c,
                inProgress: inProgress.c,
                onHold: onHold.c,
                completed: completed.c,
                overdue: overdue.c
            }
        });
    } catch (error) {
        console.error("Task stats error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch task stats." });
    }
};

// 5. GET /api/tasks/employees — Employees list for assignment dropdown
const getEmployeesForAssignment = async (req, res) => {
    try {
        const role = req.user.role;
        let query = "SELECT employee_id, first_name, last_name, department, designation FROM employees";
        const params = [];

        if (role === "Manager") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) { query += " WHERE department = ?"; params.push(emp.department); }
        }

        query += " ORDER BY first_name ASC";
        const [rows] = await db.promise().query(query, params);
        return res.status(200).json({ success: true, employees: rows });
    } catch (error) {
        console.error("Get employees for assignment error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch employees." });
    }
};

// 6. GET /api/tasks/:id — Get single task
const getTaskById = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT t.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.designation, e.department AS emp_dept, d.department_name AS proj_dept,
             p.repository_provider, p.repository_url, p.default_branch, p.manager_id AS project_manager_id
             FROM tasks t
             LEFT JOIN employees e ON t.employee_id = e.employee_id
             LEFT JOIN projects p ON t.project_id = p.id
             LEFT JOIN departments d ON p.department_id = d.id
             WHERE t.id = ?`,
            [req.params.id]
        );

        if (!rows.length) return res.status(404).json({ success: false, message: "Task not found." });
        
        const task = computeStatus(rows[0]);

        if (task.project_id) {
            const [members] = await db.promise().query("SELECT employee_id FROM project_members WHERE project_id = ?", [task.project_id]);
            task.project_members = members.map(m => m.employee_id);
        } else {
            task.project_members = [];
        }

        // Fetch submissions
        const [submissions] = await db.promise().query(
            "SELECT * FROM task_submissions WHERE task_id = ? ORDER BY submitted_at DESC",
            [req.params.id]
        );
        task.submissions = submissions.map(s => {
            if (typeof s.file_paths === "string") {
                try { s.file_paths = JSON.parse(s.file_paths); } catch(e) {}
            }
            return s;
        });

        return res.status(200).json({ success: true, task });
    } catch (error) {
        console.error("Get task by ID error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch task." });
    }
};

// 7. PUT /api/tasks/:id — Update task
const updateTask = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Task not found." });

        const task = rows[0];
        const role = req.user.role;

        if (role === "Employee") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (!emp || (String(task.employee_id) !== String(emp.employee_id) && String(task.employee_id) !== String(req.user.id) && String(task.employee_id) !== String(req.user.login_id))) {
                return res.status(403).json({ success: false, message: "Forbidden: You can only update tasks assigned to you." });
            }
            // Employee: only status + remarks
            const { status, remarks } = req.body;
            const newStatus = status || task.status;
            const completionDate = newStatus === "Completed" ? new Date().toISOString().split("T")[0] : task.completion_date;

            await db.promise().query(
                "UPDATE tasks SET status = ?, remarks = ?, completion_date = ? WHERE id = ?",
                [newStatus, remarks !== undefined ? remarks : task.remarks, completionDate, req.params.id]
            );
        } else {
            // Admin / Manager: full update
            const { task_title, description, assigned_to, priority, status, deadline, department, remarks, project_id, start_date } = req.body;

            const emp = await getEmployeeFromUser(req.user.id);
            if (role === "Manager") {
                if (!emp || task.department !== emp.department) {
                    return res.status(403).json({ success: false, message: "Forbidden: Task is not in your department." });
                }

                if (assigned_to && assigned_to !== task.employee_id) {
                    const [empRows] = await db.promise().query("SELECT department FROM employees WHERE employee_id = ?", [assigned_to]);
                    if (empRows.length && empRows[0].department !== emp.department) {
                        return res.status(403).json({ success: false, message: "Forbidden: New assignee is not in your department." });
                    }
                }
            }

            let dept = department || task.department;
            if (assigned_to && assigned_to !== task.employee_id && !department) {
                const [empRows] = await db.promise().query("SELECT department FROM employees WHERE employee_id = ?", [assigned_to]);
                if (empRows.length) dept = empRows[0].department;
            }

            const newStatus = status || task.status;
            const completionDate = newStatus === "Completed" ? (task.completion_date || new Date().toISOString().split("T")[0]) : task.completion_date;

            await db.promise().query(
                `UPDATE tasks SET task_title = ?, description = ?, employee_id = ?, priority = ?,
                 status = ?, deadline = ?, department = ?, remarks = ?, completion_date = ?, project_id = ?, start_date = ? WHERE id = ?`,
                [
                    task_title || task.task_title,
                    description !== undefined ? description : task.description,
                    assigned_to || task.employee_id,
                    priority || task.priority,
                    newStatus,
                    deadline || task.deadline,
                    dept,
                    remarks !== undefined ? remarks : task.remarks,
                    completionDate,
                    project_id !== undefined ? project_id : task.project_id,
                    start_date !== undefined ? start_date : task.start_date,
                    req.params.id
                ]
            );
        }

        // Handle proof of completion (evidence)
        const { summary, notes, evidence_type, repository_url, commit_hash, pull_request_url, branch_name, demo_url } = req.body;
        if (summary || evidence_type || (req.files && req.files.length > 0)) {
            let filePaths = [];
            if (req.files && req.files.length > 0) {
                filePaths = req.files.map(f => f.filename);
            }
            
            const actingEmp = await getEmployeeFromUser(req.user.id);
            const actingEmpId = actingEmp ? actingEmp.employee_id : task.employee_id; // Default to task assignee if admin has no employee profile

            await db.promise().query(
                `INSERT INTO task_submissions 
                (task_id, employee_id, summary, notes, evidence_type, repository_url, commit_hash, pull_request_url, branch_name, demo_url, file_paths, review_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [req.params.id, actingEmpId, summary || null, notes || null, evidence_type || null, repository_url || null, commit_hash || null, pull_request_url || null, branch_name || null, demo_url || null, JSON.stringify(filePaths)]
            );
        }

        const finalStatus = req.body.status || task.status;
        if (finalStatus === "Completed" && task.status !== "Completed" && task.assigned_by_user_id) {
            const { createNotification } = require("./notificationController");
            await createNotification(
                task.assigned_by_user_id,
                "Task Completed",
                `Task "${task.task_title}" has been marked as completed.`
            );
        }

        return res.status(200).json({ success: true, message: "Task updated successfully." });
    } catch (error) {
        console.error("Update task error:", error);
        return res.status(500).json({ success: false, message: "Failed to update task." });
    }
};

// 8. DELETE /api/tasks/:id — Delete task (Admin only)
const deleteTask = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT id FROM tasks WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Task not found." });

        await db.promise().query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
        return res.status(200).json({ success: true, message: "Task deleted successfully." });
    } catch (error) {
        console.error("Delete task error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete task." });
    }
};

// Submit Task Evidence (Employee)
const submitTaskEvidence = async (req, res) => {
    try {
        const taskId = req.params.id;
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(403).json({ success: false, message: "Only employees can submit evidence." });
        
        const [taskRows] = await db.promise().query("SELECT employee_id FROM tasks WHERE id = ?", [taskId]);
        if (!taskRows.length) return res.status(404).json({ success: false, message: "Task not found." });
        
        if (String(taskRows[0].employee_id) !== String(emp.employee_id) && String(taskRows[0].employee_id) !== String(req.user.id) && String(taskRows[0].employee_id) !== String(req.user.login_id)) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only submit evidence for your own tasks." });
        }

        const { summary, notes, evidence_type, repository_url, commit_hash, pull_request_url, branch_name, demo_url } = req.body;
        
        let filePaths = [];
        if (req.files && req.files.length > 0) {
            filePaths = req.files.map(f => f.filename);
        }

        // Insert submission
        await db.promise().query(
            `INSERT INTO task_submissions 
            (task_id, employee_id, summary, notes, evidence_type, repository_url, commit_hash, pull_request_url, branch_name, demo_url, file_paths, review_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [taskId, emp.employee_id, summary || null, notes || null, evidence_type || null, repository_url || null, commit_hash || null, pull_request_url || null, branch_name || null, demo_url || null, JSON.stringify(filePaths)]
        );

        // Update task status
        await db.promise().query("UPDATE tasks SET status = 'Submitted for Review' WHERE id = ?", [taskId]);

        return res.status(200).json({ success: true, message: "Evidence submitted successfully." });
    } catch (error) {
        console.error("Submit evidence error:", error);
        return res.status(500).json({ success: false, message: "Failed to submit evidence." });
    }
};

// Review Task Submission (Manager/Admin)
const reviewTaskSubmission = async (req, res) => {
    try {
        const { id, submissionId } = req.params;
        const { status, review_comments } = req.body; // status: 'Approved' or 'Rejected'
        
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        await db.promise().query(
            "UPDATE task_submissions SET review_status = ?, review_comments = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
            [status, review_comments || null, req.user.id, submissionId]
        );

        const taskStatus = status === 'Approved' ? 'Completed' : 'Needs Revision';
        const completionDate = status === 'Approved' ? new Date().toISOString().split("T")[0] : null;

        await db.promise().query(
            "UPDATE tasks SET status = ?, completion_date = ? WHERE id = ?",
            [taskStatus, completionDate, id]
        );

        return res.status(200).json({ success: true, message: "Submission reviewed successfully." });
    } catch (error) {
        console.error("Review submission error:", error);
        return res.status(500).json({ success: false, message: "Failed to review submission." });
    }
};

// Remove a specific commit from a submission
const removeCommitFromSubmission = async (req, res) => {
    try {
        const { id, submissionId, commitHash } = req.params;

        // Check if user is allowed to edit this submission
        const role = req.user.role;
        const emp = await getEmployeeFromUser(req.user.id);
        
        const [submissions] = await db.promise().query(
            "SELECT * FROM task_submissions WHERE id = ? AND task_id = ?",
            [submissionId, id]
        );
        if (!submissions.length) return res.status(404).json({ success: false, message: "Submission not found." });

        const sub = submissions[0];

        // If employee, they can only edit their own submissions
        if (role === "Employee") {
            if (!emp || (String(sub.employee_id) !== String(emp.employee_id) && String(sub.employee_id) !== String(req.user.id) && String(sub.employee_id) !== String(req.user.login_id))) {
                return res.status(403).json({ success: false, message: "Forbidden: You can only modify your own submissions." });
            }
        }
        
        if (sub.review_status === "Approved") {
            return res.status(400).json({ success: false, message: "Cannot modify an approved submission." });
        }

        // Parse and remove the commit hash
        if (!sub.commit_hash) return res.status(400).json({ success: false, message: "No commits found in this submission." });

        const commitHashes = sub.commit_hash.split(',').map(h => h.trim()).filter(Boolean);
        const newCommitHashes = commitHashes.filter(h => h !== commitHash);

        // Check if there are other forms of evidence
        let hasFiles = false;
        try {
            const parsedFiles = JSON.parse(sub.file_paths || '[]');
            if (parsedFiles && parsedFiles.length > 0) hasFiles = true;
        } catch (e) {}

        if (newCommitHashes.length === 0 && !hasFiles && !sub.demo_url && !sub.summary && !sub.notes) {
            // No evidence left, auto-delete the entire submission
            await db.promise().query("DELETE FROM task_submissions WHERE id = ?", [submissionId]);
            return res.status(200).json({ success: true, message: "Commit removed and empty submission deleted." });
        } else {
            await db.promise().query(
                "UPDATE task_submissions SET commit_hash = ? WHERE id = ?",
                [newCommitHashes.join(', ') || null, submissionId]
            );
            return res.status(200).json({ success: true, message: "Commit removed successfully." });
        }
    } catch (error) {
        console.error("Remove commit error:", error);
        return res.status(500).json({ success: false, message: "Failed to remove commit." });
    }
};

// Delete an entire task submission
const deleteTaskSubmission = async (req, res) => {
    try {
        const { id, submissionId } = req.params;
        const role = req.user.role;
        const emp = await getEmployeeFromUser(req.user.id);
        
        const [submissions] = await db.promise().query(
            "SELECT * FROM task_submissions WHERE id = ? AND task_id = ?",
            [submissionId, id]
        );
        if (!submissions.length) return res.status(404).json({ success: false, message: "Submission not found." });

        const sub = submissions[0];

        if (role === "Employee") {
            if (!emp || (String(sub.employee_id) !== String(emp.employee_id) && String(sub.employee_id) !== String(req.user.id) && String(sub.employee_id) !== String(req.user.login_id))) {
                return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own submissions." });
            }
        }
        
        if (sub.review_status === "Approved") {
            return res.status(400).json({ success: false, message: "Cannot delete an approved submission." });
        }

        await db.promise().query("DELETE FROM task_submissions WHERE id = ?", [submissionId]);

        return res.status(200).json({ success: true, message: "Submission deleted successfully." });
    } catch (error) {
        console.error("Delete submission error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete submission." });
    }
};

module.exports = {
    createTask, getAllTasks, getMyTasks, getTaskStats,
    getEmployeesForAssignment, getTaskById, updateTask, deleteTask,
    submitTaskEvidence, reviewTaskSubmission, removeCommitFromSubmission, deleteTaskSubmission
};