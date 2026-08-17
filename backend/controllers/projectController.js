const db = require("../config/db");
const { createNotification } = require("./notificationController");

// --- PROJECT CRUD ---
const createProject = async (req, res) => {
    try {
        const { project_name, description, department_id, manager_id, priority, start_date, end_date, project_color, project_icon, repository_provider, repository_url, default_branch } = req.body;
        if (!project_name) return res.status(400).json({ success: false, message: "Project name is required" });

        const [result] = await db.promise().query(
            `INSERT INTO projects (project_name, description, department_id, manager_id, priority, start_date, end_date, project_color, project_icon, repository_provider, repository_url, default_branch, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [project_name, description, department_id, manager_id, priority, start_date, end_date, project_color, project_icon, repository_provider || 'GitHub', repository_url || null, default_branch || 'main', req.user.id]
        );

        const projectCode = `PRJ${String(result.insertId).padStart(4, "0")}`;
        await db.promise().query("UPDATE projects SET project_code = ? WHERE id = ?", [projectCode, result.insertId]);

        await createNotification(
            req.user.id,
            "Project Created",
            `You successfully initialized project "${project_name}" (${projectCode}).`
        );

        res.status(201).json({ success: true, message: "Project created", projectId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateProject = async (req, res) => {
    try {
        const { project_name, description, department_id, manager_id, priority, status, start_date, end_date, project_color, project_icon, repository_provider, repository_url, default_branch } = req.body;
        
        await db.promise().query(
            `UPDATE projects SET project_name=?, description=?, department_id=?, manager_id=?, priority=?, status=?, start_date=?, end_date=?, project_color=?, project_icon=?, repository_provider=?, repository_url=?, default_branch=? WHERE id=?`,
            [project_name, description, department_id, manager_id, priority, status, start_date, end_date, project_color, project_icon, repository_provider, repository_url, default_branch, req.params.id]
        );

        if (status === 'Completed') {
            const [members] = await db.promise().query(`
                SELECT u.id as user_id FROM project_members pm
                JOIN employees e ON pm.employee_id = e.employee_id
                LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email
                WHERE pm.project_id = ?
            `, [req.params.id]);
            for (const m of members) {
                if (m.user_id) {
                    await createNotification(m.user_id, "Project Completed", `Project "${project_name}" has been marked as Completed!`);
                }
            }
        }

        res.json({ success: true, message: "Project updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const deleteProject = async (req, res) => {
    try {
        await db.promise().query("DELETE FROM projects WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Project deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAllProjects = async (req, res) => {
    try {
        let projects = [];
        if (req.user.role === 'Employee') {
            const [rows] = await db.promise().query(`
                SELECT p.* FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.employee_id = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `, [req.user.login_id]);
            projects = rows;
        } else {
            const [rows] = await db.promise().query(`SELECT * FROM projects ORDER BY created_at DESC`);
            projects = rows;
        }
        
        // Compute progress dynamically
        for (let p of projects) {
            const [[stats]] = await db.promise().query(`
                SELECT 
                    COUNT(*) as total, 
                    SUM(IF(status='Completed', 1, 0)) as completed
                FROM tasks WHERE project_id = ?
            `, [p.id]);
            p.completion_percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            
            // fetch member count and ids
            const [members] = await db.promise().query("SELECT employee_id FROM project_members WHERE project_id = ?", [p.id]);
            p.member_count = members.length;
            p.member_ids = members.map(m => m.employee_id);
        }

        res.json({ success: true, projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getProjectById = async (req, res) => {
    try {
        const [[project]] = await db.promise().query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
        if (!project) return res.status(404).json({ success: false, message: "Not found" });
        
        // Members
        const [members] = await db.promise().query(`
            SELECT pm.*, e.first_name, e.last_name, e.department, e.designation 
            FROM project_members pm
            JOIN employees e ON pm.employee_id = e.employee_id
            WHERE pm.project_id = ?
        `, [req.params.id]);
        
        // Milestones
        const [milestones] = await db.promise().query("SELECT * FROM project_milestones WHERE project_id = ? ORDER BY due_date ASC", [req.params.id]);
        
        // Tasks
        const [tasks] = await db.promise().query(`
            SELECT t.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name
            FROM tasks t
            LEFT JOIN employees e ON t.employee_id = e.employee_id
            WHERE t.project_id = ?
        `, [req.params.id]);

        res.json({ success: true, project, members, milestones, tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const archiveProject = async (req, res) => {
    try {
        await db.promise().query("UPDATE projects SET status = 'Archived' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Project archived" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --- MEMBERS ---
const addMember = async (req, res) => {
    try {
        const { project_id, employee_id } = req.body;
        // Check if exists
        const [exist] = await db.promise().query("SELECT id FROM project_members WHERE project_id=? AND employee_id=?", [project_id, employee_id]);
        if (exist.length > 0) return res.status(400).json({ success: false, message: "Member already added" });
        
        await db.promise().query("INSERT INTO project_members (project_id, employee_id) VALUES (?, ?)", [project_id, employee_id]);

        const [projRows] = await db.promise().query("SELECT project_name FROM projects WHERE id = ?", [project_id]);
        const projectName = projRows.length ? projRows[0].project_name : "a project";

        const [userRows] = await db.promise().query(`
            SELECT u.id AS user_id FROM employees e 
            LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email 
            WHERE e.employee_id = ?
        `, [employee_id]);
        if (userRows.length && userRows[0].user_id) {
            await createNotification(userRows[0].user_id, "Member Added", `You have been added to the team for project "${projectName}".`);
        }

        res.json({ success: true, message: "Member added" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const removeMember = async (req, res) => {
    try {
        const { project_id, employee_id } = req.query; // using query params for delete
        await db.promise().query("DELETE FROM project_members WHERE project_id=? AND employee_id=?", [project_id, employee_id]);
        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --- MILESTONES ---
const createMilestone = async (req, res) => {
    try {
        const { project_id, title, description, due_date } = req.body;
        await db.promise().query(
            "INSERT INTO project_milestones (project_id, title, description, due_date) VALUES (?, ?, ?, ?)",
            [project_id, title, description, due_date]
        );
        res.status(201).json({ success: true, message: "Milestone created" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateMilestone = async (req, res) => {
    try {
        const { title, description, due_date, status } = req.body;
        let completion_date = null;
        if (status === 'Completed') {
            completion_date = new Date().toISOString().split('T')[0];
        }
        await db.promise().query(
            "UPDATE project_milestones SET title=?, description=?, due_date=?, status=?, completion_date=? WHERE id=?",
            [title, description, due_date, status, completion_date, req.params.id]
        );

        if (status === 'Completed') {
            const [msRows] = await db.promise().query("SELECT project_id, title FROM project_milestones WHERE id = ?", [req.params.id]);
            if (msRows.length) {
                const { project_id, title: msTitle } = msRows[0];
                const [projRows] = await db.promise().query("SELECT project_name, created_by FROM projects WHERE id = ?", [project_id]);
                if (projRows.length) {
                    const { project_name, created_by } = projRows[0];
                    if (created_by) await createNotification(created_by, "Milestone Completed", `Milestone "${msTitle}" in project "${project_name}" has been completed!`);
                }
            }
        }

        res.json({ success: true, message: "Milestone updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const deleteMilestone = async (req, res) => {
    try {
        await db.promise().query("DELETE FROM project_milestones WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Milestone deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --- ANALYTICS ---
const getProjectAnalytics = async (req, res) => {
    try {
        const [[pStats]] = await db.promise().query(`
            SELECT 
                COUNT(*) as total,
                SUM(IF(status='Active', 1, 0)) as active,
                SUM(IF(status='Completed', 1, 0)) as completed,
                SUM(IF(status='On Hold', 1, 0)) as on_hold,
                SUM(IF(end_date < CURDATE() AND status != 'Completed', 1, 0)) as overdue
            FROM projects
        `);

        // Compute overall progress
        const [projects] = await db.promise().query("SELECT id FROM projects");
        let totalProgress = 0;
        let count = 0;
        for (let p of projects) {
            const [[tStats]] = await db.promise().query(`
                SELECT COUNT(*) as total, SUM(IF(status='Completed', 1, 0)) as completed
                FROM tasks WHERE project_id = ?
            `, [p.id]);
            if (tStats.total > 0) {
                totalProgress += (tStats.completed / tStats.total) * 100;
                count++;
            }
        }
        const avg_progress = count > 0 ? Math.round(totalProgress / count) : 0;

        // Department dist
        const [deptDist] = await db.promise().query(`
            SELECT department_id as name, COUNT(*) as value 
            FROM projects GROUP BY department_id
        `);

        res.json({
            success: true,
            stats: {
                total: pStats.total || 0,
                active: pStats.active || 0,
                completed: pStats.completed || 0,
                on_hold: pStats.on_hold || 0,
                overdue: pStats.overdue || 0,
                avg_progress
            },
            deptDist: deptDist.map(d => ({ name: d.name || 'Unassigned', value: d.value }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createProject, updateProject, deleteProject, getAllProjects, getProjectById, archiveProject,
    addMember, removeMember,
    createMilestone, updateMilestone, deleteMilestone,
    getProjectAnalytics
};
