const db = require("../config/db");
const { createNotification } = require("./notificationController");

// Helper: Get employee info from logged-in user
const getEmployeeFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    if (!users.length) return null;
    const u = users[0];
    const [emps] = await db.promise().query("SELECT * FROM employees WHERE email = ? OR employee_id = ?", [u.email, u.login_id]);
    return emps.length ? emps[0] : null;
};

// 1. Employee: Apply for Resignation
const applyResignation = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: "Employee not found." });

        const { reason, notice_period_days, last_working_day, review_comments } = req.body;
        
        if (!reason || notice_period_days === undefined || !last_working_day) {
            return res.status(400).json({ success: false, message: "Reason, notice period, and last working day are required." });
        }

        if (notice_period_days <= 0 || notice_period_days > 365) {
            return res.status(400).json({ success: false, message: "Notice period must be between 1 and 365 days." });
        }

        const lwd = new Date(last_working_day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lwd < today) {
            return res.status(400).json({ success: false, message: "Last working day cannot be in the past." });
        }

        // Check for duplicates
        const [existing] = await db.promise().query(
            "SELECT id FROM resignation_requests WHERE employee_id = ? AND status IN ('Submitted', 'Approved', 'Cancellation Requested')",
            [emp.employee_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "You already have an active resignation request." });
        }

        await db.promise().query(
            `INSERT INTO resignation_requests (employee_id, reason, notice_period_days, last_working_day, review_comments)
             VALUES (?, ?, ?, ?, ?)`,
            [emp.employee_id, reason, notice_period_days, last_working_day, review_comments || null]
        );

        // Notify Admins
        const [admins] = await db.promise().query("SELECT id FROM users WHERE role_id = 1");
        for (const admin of admins) {
            await createNotification(admin.id, "New Resignation Request", `Employee ${emp.first_name} ${emp.last_name} has submitted a resignation request.`);
        }

        res.status(201).json({ success: true, message: "Resignation submitted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 2. Employee: Withdraw Resignation
const withdrawResignation = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: "Employee not found." });

        const [request] = await db.promise().query(
            "SELECT * FROM resignation_requests WHERE id = ? AND employee_id = ?",
            [req.params.id, emp.employee_id]
        );

        if (!request.length) return res.status(404).json({ success: false, message: "Request not found." });

        if (request[0].status !== 'Submitted') {
            return res.status(400).json({ success: false, message: "Can only withdraw if status is Submitted." });
        }

        await db.promise().query(
            "UPDATE resignation_requests SET status = 'Withdrawn' WHERE id = ?",
            [req.params.id]
        );

        res.status(200).json({ success: true, message: "Resignation withdrawn successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 3. Employee: Get their active resignation + active work counts
const getEmployeeResignation = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: "Employee not found." });

        // Get active work
        const [taskRows] = await db.promise().query(
            "SELECT COUNT(*) as activeTasks FROM tasks WHERE employee_id = ? AND status != 'Completed'",
            [emp.employee_id]
        );
        const [projectRows] = await db.promise().query(
            `SELECT COUNT(*) as activeProjects FROM project_members pm 
             JOIN projects p ON pm.project_id = p.id 
             WHERE pm.employee_id = ? AND p.status != 'Completed'`,
            [emp.employee_id]
        );

        const activeWork = {
            activeTasks: taskRows[0].activeTasks,
            activeProjects: projectRows[0].activeProjects
        };

        const [requests] = await db.promise().query(
            "SELECT * FROM resignation_requests WHERE employee_id = ? ORDER BY submitted_at DESC LIMIT 1",
            [emp.employee_id]
        );

        if (!requests.length) {
            return res.status(200).json({ success: true, request: null, activeWork });
        }

        res.status(200).json({ success: true, request: requests[0], activeWork });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Admin: Get all resignations
const getAllResignations = async (req, res) => {
    try {
        const [requests] = await db.promise().query(`
            SELECT rr.*, e.first_name, e.last_name, e.department, e.joining_date
            FROM resignation_requests rr
            JOIN employees e ON rr.employee_id = e.employee_id
            ORDER BY rr.submitted_at DESC
        `);

        // Enhance with active work for the modal
        for (let r of requests) {
            const [taskRows] = await db.promise().query(
                "SELECT COUNT(*) as activeTasks FROM tasks WHERE employee_id = ? AND status != 'Completed'",
                [r.employee_id]
            );
            const [projectRows] = await db.promise().query(
                `SELECT COUNT(*) as activeProjects FROM project_members pm 
                 JOIN projects p ON pm.project_id = p.id 
                 WHERE pm.employee_id = ? AND p.status != 'Completed'`,
                [r.employee_id]
            );
            r.activeTasks = taskRows[0].activeTasks;
            r.activeProjects = projectRows[0].activeProjects;
        }

        res.status(200).json({ success: true, requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 5. Admin: Update resignation status (Approve/Reject)
const updateResignationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, review_comments } = req.body;

        if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const [request] = await db.promise().query("SELECT employee_id FROM resignation_requests WHERE id = ?", [id]);
        if (!request.length) return res.status(404).json({ success: false, message: "Request not found." });
        
        await db.promise().query(
            "UPDATE resignation_requests SET status = ?, review_comments = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [status, review_comments, req.user.id, id]
        );

        // Notify Employee
        const empId = request[0].employee_id;
        const [users] = await db.promise().query(
            `SELECT u.id FROM users u 
             JOIN employees e ON u.login_id = e.employee_id OR u.email = e.email 
             WHERE e.employee_id = ?`,
            [empId]
        );
        
        if (users.length > 0) {
            await createNotification(
                users[0].id,
                `Resignation ${status}`,
                `Your resignation request has been ${status.toLowerCase()}.`
            );
        }

        res.status(200).json({ success: true, message: `Resignation ${status.toLowerCase()} successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
// 6. Employee: Request Cancellation of Approved Resignation
const requestCancellation = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) return res.status(404).json({ success: false, message: "Employee not found." });

        const [request] = await db.promise().query(
            "SELECT * FROM resignation_requests WHERE id = ? AND employee_id = ?",
            [req.params.id, emp.employee_id]
        );

        if (!request.length) return res.status(404).json({ success: false, message: "Request not found." });

        if (request[0].status !== 'Approved') {
            return res.status(400).json({ success: false, message: "Can only request cancellation for Approved resignations." });
        }

        await db.promise().query(
            "UPDATE resignation_requests SET status = 'Cancellation Requested' WHERE id = ?",
            [req.params.id]
        );

        // Notify Admins
        const [admins] = await db.promise().query("SELECT id FROM users WHERE role_id = 1");
        for (const admin of admins) {
            await createNotification(admin.id, "Cancellation Requested", `Employee ${emp.first_name} ${emp.last_name} has requested to cancel their resignation.`);
        }

        res.status(200).json({ success: true, message: "Cancellation requested successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
module.exports = {
    applyResignation,
    withdrawResignation,
    getEmployeeResignation,
    getAllResignations,
    updateResignationStatus,
    requestCancellation
};
