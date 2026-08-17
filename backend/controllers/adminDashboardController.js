const db = require("../config/db");

const getAdminDashboardStats = async (req, res) => {
    try {
        const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

        // 1. Total Employees
        const [[{ totalEmployees }]] = await db.promise().query(
            "SELECT COUNT(*) AS totalEmployees FROM employees WHERE status = 'Active'"
        );

        // 2. Departments count
        const [[{ departmentsCount }]] = await db.promise().query(
            "SELECT COUNT(*) AS departmentsCount FROM departments"
        );

        // 3. Present Today
        const [[{ presentToday }]] = await db.promise().query(
            "SELECT COUNT(*) AS presentToday FROM attendance WHERE attendance_date = ? AND status IN ('Present', 'Late', 'Half Day')",
            [todayStr]
        );

        // 4. Late Today
        const [[{ lateToday }]] = await db.promise().query(
            "SELECT COUNT(*) AS lateToday FROM attendance WHERE attendance_date = ? AND status = 'Late'",
            [todayStr]
        );

        // 5. Absent Today
        const absentToday = Math.max(0, totalEmployees - presentToday);

        // 6. Attendance Rate
        const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

        // 7. Pending Leaves count
        const [[{ pendingLeaves }]] = await db.promise().query(
            "SELECT COUNT(*) AS pendingLeaves FROM leave_requests WHERE status = 'Pending'"
        );

        // 8. Active Tasks count
        const [[{ activeTasks }]] = await db.promise().query(
            "SELECT COUNT(*) AS activeTasks FROM tasks WHERE status != 'Completed'"
        );

        // 9. Department Distribution (for doughnut chart)
        const [deptDist] = await db.promise().query(
            `SELECT department AS name, COUNT(*) AS value 
             FROM employees 
             WHERE status = 'Active' AND department IS NOT NULL AND department != ''
             GROUP BY department`
        );

        // 10. Pending Leave Requests (list)
        const [leavesList] = await db.promise().query(
            `SELECT lr.id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.email, e.department, 
                    lt.name AS leave_type, lr.start_date, lr.end_date, lr.status, lr.total_days, e.employee_id
             FROM leave_requests lr
             JOIN employees e ON lr.employee_id = e.employee_id
             JOIN leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.status = 'Pending'
             ORDER BY lr.created_at DESC LIMIT 5`
        );

        // 11. Recent Activities
        const activities = [];

        // - Attendance check-ins today
        const [attendanceLogs] = await db.promise().query(
            `SELECT a.check_in, a.status, e.first_name, e.last_name, a.created_at
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.attendance_date = ?
             ORDER BY a.check_in DESC LIMIT 5`,
            [todayStr]
        );
        attendanceLogs.forEach(log => {
            activities.push({
                title: "Employee Checked In",
                message: `${log.first_name} ${log.last_name} checked in (${log.status})`,
                created_at: log.created_at,
                type: "attendance"
            });
        });

        // - Leave requests
        const [leaveLogs] = await db.promise().query(
            `SELECT lr.created_at, e.first_name, e.last_name, lt.name AS leave_type
             FROM leave_requests lr
             JOIN employees e ON lr.employee_id = e.employee_id
             JOIN leave_types lt ON lr.leave_type_id = lt.id
             ORDER BY lr.created_at DESC LIMIT 5`
        );
        leaveLogs.forEach(log => {
            activities.push({
                title: "Leave Request Submitted",
                message: `${log.first_name} ${log.last_name} requested ${log.leave_type}.`,
                created_at: log.created_at,
                type: "leave"
            });
        });

        // - Task updates
        const [taskLogs] = await db.promise().query(
            `SELECT t.task_title, t.status, t.updated_at, CONCAT(e.first_name, ' ', e.last_name) AS employee_name
             FROM tasks t
             JOIN employees e ON t.employee_id = e.employee_id
             ORDER BY t.updated_at DESC LIMIT 5`
        );
        taskLogs.forEach(log => {
            activities.push({
                title: "Task Status Updated",
                message: `${log.employee_name} marked task "${log.task_title}" as ${log.status}.`,
                created_at: log.updated_at,
                type: "task"
            });
        });

        // Sort activities by date desc, limit to 6
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const recentActivities = activities.slice(0, 6);

        // 12. Attendance Trend (Rolling last 5 working days ending today)
        const trendLabels = [];
        const trendData = [];
        
        // Helper function to get last 5 working days
        const getWorkingDays = () => {
            const days = [];
            const labels = [];
            let current = new Date();
            // If today is weekend, go back to Friday
            while (current.getDay() === 0 || current.getDay() === 6) {
                current.setDate(current.getDate() - 1);
            }
            while (days.length < 5) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    days.push(new Date(current));
                    labels.push(current.toLocaleDateString('en-US', { weekday: 'short' }));
                }
                current.setDate(current.getDate() - 1);
            }
            return {
                dates: days.reverse().map(d => d.toLocaleDateString('sv')),
                labels: labels.reverse()
            };
        };

        const { dates, labels } = getWorkingDays();

        for (let i = 0; i < dates.length; i++) {
            const dateStr = dates[i];
            trendLabels.push(labels[i]);

            const [[{ count }]] = await db.promise().query(
                "SELECT COUNT(*) AS count FROM attendance WHERE attendance_date = ? AND status IN ('Present', 'Late', 'Half Day')",
                [dateStr]
            );
            trendData.push(count || 0);
        }

        const [[pStats]] = await db.promise().query(
            `SELECT COUNT(*) as total,
                    SUM(IF(status != 'Completed', 1, 0)) as active,
                    SUM(IF(status = 'Completed', 1, 0)) as completed,
                    AVG(IFNULL(completion_percentage, 0)) as avgProgress
             FROM projects`
        );

        return res.status(200).json({
            success: true,
            stats: {
                totalEmployees,
                departmentsCount,
                presentToday,
                lateToday,
                absentToday,
                attendanceRate,
                pendingLeaves,
                activeTasks
            },
            projectStats: {
                total: pStats.total || 0,
                active: pStats.active || 0,
                completed: pStats.completed || 0,
                avgProgress: Math.round(pStats.avgProgress || 0)
            },
            deptDist,
            leavesList,
            recentActivities,
            attendanceTrend: {
                labels: trendLabels,
                data: trendData
            }
        });
    } catch (error) {
        console.error("Admin dashboard stats API error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics."
        });
    }
};

module.exports = {
    getAdminDashboardStats
};
