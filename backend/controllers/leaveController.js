const db = require("../config/db");

// Helper: Get employee_id for the logged-in user
const getEmployeeIdFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return null;

    const [employees] = await db.promise().query("SELECT employee_id FROM employees WHERE email = ?", [users[0].email]);
    if (employees.length === 0) return null;

    return employees[0].employee_id;
};

const getManagerDepartment = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return null;
    const [employees] = await db.promise().query("SELECT department FROM employees WHERE email = ?", [users[0].email]);
    return employees.length ? employees[0].department : null;
};

// 1. GET /api/leaves/types — fetch all leave types for the apply form dropdown
const getLeaveTypes = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT id, name FROM leave_types ORDER BY name ASC");
        return res.status(200).json({ success: true, types: rows });
    } catch (error) {
        console.error("Get leave types error:", error);
        return res.status(500).json({ success: false, message: "Failed to load leave types." });
    }
};

// 2. POST /api/leaves/apply
const applyLeave = async (req, res) => {
    try {
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        const { leave_type_id, start_date, end_date, reason } = req.body;
        if (!leave_type_id || !start_date || !end_date || !reason) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            return res.status(400).json({ success: false, message: "End Date must be after or equal to Start Date." });
        }

        await db.promise().query(
            `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
            [employeeId, leave_type_id, start_date, end_date, totalDays, reason]
        );

        // Fetch employee details
        const [empRows] = await db.promise().query(
            `SELECT first_name, last_name, department FROM employees WHERE employee_id = ?`,
            [employeeId]
        );

        if (empRows.length > 0) {
            const applicant = empRows[0];

            // Find the manager of this department
            const [managerRows] = await db.promise().query(
                `SELECT e.email, e.first_name, u.id AS user_id 
                 FROM employees e
                 JOIN users u ON e.employee_id = u.login_id OR e.email = u.email
                 WHERE e.department = ? AND u.role_id = 2`,
                [applicant.department]
            );

            const manager = managerRows.length > 0 ? managerRows[0] : null;

            // Default to first admin if no manager exists
            let targetRecipient = manager;
            if (!targetRecipient) {
                const [adminRows] = await db.promise().query(
                    `SELECT email, name AS first_name, id AS user_id FROM users WHERE role_id = 1 LIMIT 1`
                );
                if (adminRows.length > 0) {
                    targetRecipient = adminRows[0];
                }
            }

            if (targetRecipient) {
                const leaveUrl = `http://localhost:5173/admin/leaves`;

                // 1. Create database notification for UI bell
                const { createNotification } = require("./notificationController");
                await createNotification(
                    targetRecipient.user_id,
                    "New Leave Request",
                    `Employee ${applicant.first_name} ${applicant.last_name} applied for leave from ${start_date} to ${end_date} (${totalDays} days). Reason: ${reason}`
                );

                // 2. Send Email alert
                const { sendEmail } = require("../utils/emailHelper");
                const emailHtml = `
                    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #4f7df0; margin-top: 0;">New Leave Request Received</h2>
                        <p>Hello ${targetRecipient.first_name || "Manager"},</p>
                        <p>A new leave request has been submitted that requires your approval.</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <tr>
                                <td style="padding: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Employee:</td>
                                <td style="padding: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${applicant.first_name} ${applicant.last_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Department:</td>
                                <td style="padding: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${applicant.department}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Duration:</td>
                                <td style="padding: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${start_date} to ${end_date} (${totalDays} days)</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; color: #64748b; font-weight: 600;">Reason:</td>
                                <td style="padding: 12px; font-style: italic;">"${reason}"</td>
                            </tr>
                        </table>
                        
                        <a href="${leaveUrl}" style="display: inline-block; background: #4f7df0; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">Go to Leave Approvals</a>
                        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">This is an automated message from Staffspire Solutions. Please do not reply.</p>
                    </div>
                `;
                await sendEmail({
                    to: targetRecipient.email,
                    subject: `[Leave Request] Pending Approval - ${applicant.first_name} ${applicant.last_name}`,
                    html: emailHtml
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Leave request submitted successfully. Waiting for admin approval."
        });
    } catch (error) {
        console.error("Apply leave error:", error);
        return res.status(500).json({ success: false, message: "Server error during leave application." });
    }
};

// 3. GET /api/leaves/history
const getLeaveHistory = async (req, res) => {
    try {
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({ success: false, message: "Employee profile not found." });
        }

        const [rows] = await db.promise().query(
            `SELECT lr.*, lt.name AS leave_type_name
             FROM leave_requests lr
             JOIN leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.employee_id = ?
             ORDER BY lr.created_at DESC`,
            [employeeId]
        );

        return res.status(200).json({ success: true, history: rows });
    } catch (error) {
        console.error("Get leave history error:", error);
        return res.status(500).json({ success: false, message: "Failed to load leave history." });
    }
};

// 4. DELETE /api/leaves/cancel/:id
const cancelLeaveRequest = async (req, res) => {
    try {
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        const { id } = req.params;

        const [rows] = await db.promise().query("SELECT * FROM leave_requests WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        const request = rows[0];
        if (request.employee_id !== employeeId) {
            return res.status(403).json({ success: false, message: "Unauthorized request cancellation." });
        }

        if (request.status === "Pending") {
            await db.promise().query("DELETE FROM leave_requests WHERE id = ?", [id]);
            return res.status(200).json({ success: true, message: "Leave request cancelled successfully." });
        } else if (request.status === "Approved") {
            await db.promise().query("UPDATE leave_requests SET status = 'Pending Cancellation' WHERE id = ?", [id]);
            return res.status(200).json({ success: true, message: "Cancellation request submitted. Waiting for admin approval." });
        } else if (request.status === "Pending Cancellation") {
            return res.status(400).json({ success: false, message: "Cancellation request is already pending approval." });
        } else {
            return res.status(400).json({ success: false, message: "Only pending or approved leave requests can be cancelled." });
        }
    } catch (error) {
        console.error("Cancel leave request error:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel request." });
    }
};

// 5. GET /api/leaves/admin/requests
const adminGetLeaveRequests = async (req, res) => {
    try {
        const role = req.user.role;
        let query = `
            SELECT lr.*, lt.name AS leave_type_name, e.first_name, e.last_name, e.email, e.department, e.designation
            FROM leave_requests lr
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            JOIN employees e ON lr.employee_id = e.employee_id
        `;
        const params = [];
        if (role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (dept) {
                query += " WHERE e.department = ?";
                params.push(dept);
            } else {
                return res.status(200).json({ success: true, requests: [] });
            }
        }
        query += " ORDER BY lr.created_at DESC";

        const [rows] = await db.promise().query(query, params);
        return res.status(200).json({ success: true, requests: rows });
    } catch (error) {
        console.error("Admin fetch leave requests error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch leave requests." });
    }
};

// 6. POST /api/leaves/admin/action — Approve or Reject (management decides)
const adminLeaveAction = async (req, res) => {
    try {
        const { id, action, rejection_remarks } = req.body;
        if (!id || !action || !['Approved', 'Rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action request parameters." });
        }

        const [requests] = await db.promise().query(
            `SELECT lr.*, e.department 
             FROM leave_requests lr 
             JOIN employees e ON lr.employee_id = e.employee_id 
             WHERE lr.id = ?`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: "Leave request not found." });
        }

        if (req.user.role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (requests[0].department !== dept) {
                return res.status(403).json({ success: false, message: "Forbidden: Employee is not in your department." });
            }

            // Block managers from approving/rejecting their own leave requests
            const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [req.user.id]);
            const managerEmail = users.length ? users[0].email : null;
            const [emps] = await db.promise().query("SELECT email FROM employees WHERE employee_id = ?", [requests[0].employee_id]);
            const empEmail = emps.length ? emps[0].email : null;
            if (managerEmail && empEmail && managerEmail.toLowerCase() === empEmail.toLowerCase()) {
                return res.status(403).json({ success: false, message: "Forbidden: You cannot approve or reject your own leave request." });
            }
        }

        const request = requests[0];

        if (request.status !== "Pending" && request.status !== "Pending Cancellation") {
            return res.status(400).json({ success: false, message: "Request has already been processed or is not in a processable state." });
        }

        let targetStatus = "";
        if (request.status === "Pending Cancellation") {
            targetStatus = action === "Approved" ? "Cancelled" : "Approved";
        } else {
            targetStatus = action === "Approved" ? "Approved" : "Rejected";
        }

        if (action === "Rejected") {
            await db.promise().query(
                "UPDATE leave_requests SET status = ?, rejection_remarks = ? WHERE id = ?",
                [targetStatus, rejection_remarks || null, id]
            );
        } else {
            await db.promise().query("UPDATE leave_requests SET status = ? WHERE id = ?", [targetStatus, id]);
        }

        return res.status(200).json({
            success: true,
            message: `Leave request has been successfully processed.`
        });
    } catch (error) {
        console.error("Admin leave action error:", error);
        return res.status(500).json({ success: false, message: "Failed to process leave action." });
    }
};

// 7. GET /api/leaves/admin/stats
const adminGetLeaveStats = async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('sv');
        const role = req.user.role;
        let filter = "";
        const params = [];

        if (role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (dept) {
                filter = " AND lr.employee_id IN (SELECT employee_id FROM employees WHERE department = ?)";
                params.push(dept);
            } else {
                return res.status(200).json({
                    success: true,
                    stats: {
                        pending: 0,
                        approvedToday: 0,
                        rejectedToday: 0,
                        currentlyOnLeave: 0
                    }
                });
            }
        }

        const [pendingRes] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM leave_requests lr WHERE lr.status = 'Pending'${filter}`,
            params
        );
        const [approvedRes] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM leave_requests lr WHERE lr.status = 'Approved' AND DATE(lr.updated_at) = ?${filter}`,
            [today, ...params]
        );
        const [rejectedRes] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM leave_requests lr WHERE lr.status = 'Rejected' AND DATE(lr.updated_at) = ?${filter}`,
            [today, ...params]
        );
        const [onLeaveRes] = await db.promise().query(
            `SELECT COUNT(DISTINCT lr.employee_id) AS count FROM leave_requests lr
             WHERE lr.status = 'Approved' AND ? BETWEEN lr.start_date AND lr.end_date${filter}`,
            [today, ...params]
        );

        return res.status(200).json({
            success: true,
            stats: {
                pending: pendingRes[0].count,
                approvedToday: approvedRes[0].count,
                rejectedToday: rejectedRes[0].count,
                currentlyOnLeave: onLeaveRes[0].count
            }
        });
    } catch (error) {
        console.error("Get leave stats error:", error);
        return res.status(500).json({ success: false, message: "Failed to load leave statistics." });
    }
};

module.exports = {
    getLeaveTypes,
    applyLeave,
    getLeaveHistory,
    cancelLeaveRequest,
    adminGetLeaveRequests,
    adminLeaveAction,
    adminGetLeaveStats
};