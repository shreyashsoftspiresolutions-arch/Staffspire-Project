const db = require("../config/db");

// Ensure deadline_notifications_log table exists to track reminders across clear-alls and page refreshes
db.promise().query(`
    CREATE TABLE IF NOT EXISTS deadline_notifications_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message VARCHAR(500) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id, sent_at)
    )
`).catch(err => console.error("Error ensuring deadline_notifications_log table:", err));

// Clean up existing duplicate deadline notifications in the database
db.promise().query(`
    DELETE n1 FROM notifications n1
    INNER JOIN notifications n2 
    WHERE n1.id < n2.id 
    AND n1.user_id = n2.user_id 
    AND n1.title = 'Deadline Approaching' 
    AND n1.message = n2.message
`).catch(err => console.error("Error cleaning up duplicate notifications:", err));

// In-memory cooldown map (user_id -> last check timestamp) to avoid database spam on page refresh/polling
const userLastDeadlineCheck = new Map();

// Helper function to create notification in DB
const createNotification = async (userId, title, message) => {
    try {
        await db.promise().query(
            "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
            [userId, title, message]
        );
        return true;
    } catch (err) {
        console.error("Error creating notification helper:", err);
        return false;
    }
};

const checkApproachingDeadlines = async (userId, role) => {
    try {
        const now = Date.now();
        const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
        if (userLastDeadlineCheck.has(userId) && (now - userLastDeadlineCheck.get(userId) < SIX_HOURS_MS)) {
            return;
        }

        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);
        const todayStr = today.toISOString().slice(0, 10);
        const targetStr = threeDaysLater.toISOString().slice(0, 10);

        let checkedAny = false;

        if (role === "Employee") {
            const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
            if (users.length) {
                const [emps] = await db.promise().query("SELECT employee_id FROM employees WHERE email = ?", [users[0].email]);
                if (emps.length) {
                    const empId = emps[0].employee_id;
                    const [tasks] = await db.promise().query(
                        `SELECT task_title, deadline FROM tasks WHERE employee_id = ? AND status NOT IN ('Completed') AND deadline BETWEEN ? AND ?`,
                        [empId, todayStr, targetStr]
                    );
                    for (const t of tasks) {
                        const endStr = new Date(t.deadline).toISOString().slice(0, 10);
                        const msg = `Reminder: Task "${t.task_title}" is due soon (${endStr}).`;
                        const [existLog] = await db.promise().query("SELECT id FROM deadline_notifications_log WHERE user_id = ? AND message = ? AND sent_at >= NOW() - INTERVAL 6 HOUR", [userId, msg]);
                        const [existNotif] = await db.promise().query("SELECT id FROM notifications WHERE user_id = ? AND message = ? AND created_at >= NOW() - INTERVAL 6 HOUR", [userId, msg]);
                        if (!existLog.length && !existNotif.length) {
                            await db.promise().query("INSERT INTO deadline_notifications_log (user_id, message) VALUES (?, ?)", [userId, msg]);
                            await createNotification(userId, "Deadline Approaching", msg);
                        }
                    }
                    checkedAny = true;
                }
            }
        } else {
            const [projects] = await db.promise().query(
                `SELECT project_name, end_date FROM projects WHERE status NOT IN ('Completed', 'Archived') AND end_date BETWEEN ? AND ?`,
                [todayStr, targetStr]
            );
            for (const p of projects) {
                const endStr = new Date(p.end_date).toISOString().slice(0, 10);
                const msg = `Reminder: Project "${p.project_name}" deadline is approaching (${endStr}).`;
                const [existLog] = await db.promise().query("SELECT id FROM deadline_notifications_log WHERE user_id = ? AND message = ? AND sent_at >= NOW() - INTERVAL 6 HOUR", [userId, msg]);
                const [existNotif] = await db.promise().query("SELECT id FROM notifications WHERE user_id = ? AND message = ? AND created_at >= NOW() - INTERVAL 6 HOUR", [userId, msg]);
                if (!existLog.length && !existNotif.length) {
                    await db.promise().query("INSERT INTO deadline_notifications_log (user_id, message) VALUES (?, ?)", [userId, msg]);
                    await createNotification(userId, "Deadline Approaching", msg);
                }
            }
            checkedAny = true;
        }

        if (checkedAny) {
            userLastDeadlineCheck.set(userId, now);
        }
    } catch (e) {
        console.error("Deadline check error:", e);
    }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await checkApproachingDeadlines(userId, req.user.role);
        const [rows] = await db.promise().query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [userId]
        );
        return res.status(200).json({
            success: true,
            notifications: rows
        });
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications."
        });
    }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await db.promise().query(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        return res.status(200).json({
            success: true,
            message: "Notification marked as read."
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read."
        });
    }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.promise().query(
            "DELETE FROM notifications WHERE user_id = ?",
            [userId]
        );
        return res.status(200).json({
            success: true,
            message: "All notifications cleared."
        });
    } catch (error) {
        console.error("Error clearing all notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to clear all notifications."
        });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
