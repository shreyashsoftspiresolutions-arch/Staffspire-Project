const db = require("../config/db");

// Helper: Get employee info from logged-in user
const getEmployeeFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (!users.length) return null;
    const [emps] = await db.promise().query("SELECT * FROM employees WHERE email = ?", [users[0].email]);
    return emps.length ? emps[0] : null;
};

const getManagerDashboardInfo = async (req, res) => {
    try {
        const emp = await getEmployeeFromUser(req.user.id);
        if (!emp) {
            return res.status(404).json({
                success: false,
                message: "Manager profile not found in employee records."
            });
        }

        const deptName = emp.department;
        const managerName = `${emp.first_name} ${emp.last_name}`;
        const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD

        // 1. Employees count in department
        const [[{ employeeCount }]] = await db.promise().query(
            "SELECT COUNT(*) AS employeeCount FROM employees WHERE department = ? AND status = 'Active'",
            [deptName]
        );

        // 2. Attendance Stats (Present, Late, Absent)
        // Present/Late today in department
        const [attRows] = await db.promise().query(
            `SELECT a.status, a.check_out, a.working_hours, e.first_name, e.last_name 
             FROM attendance a 
             JOIN employees e ON a.employee_id = e.employee_id 
             WHERE e.department = ? AND a.attendance_date = ?`,
            [deptName, todayStr]
        );

        const presentCount = attRows.filter(r => r.status === "Present" || r.status === "Late" || r.status === "Half Day").length;
        const lateCount = attRows.filter(r => r.status === "Late").length;
        const absentCount = Math.max(0, employeeCount - presentCount);
        const attendancePercentage = employeeCount > 0 ? Math.round((presentCount / employeeCount) * 100) : 0;

        // 3. Pending Leaves count
        const [[{ pendingLeaves }]] = await db.promise().query(
            `SELECT COUNT(*) AS pendingLeaves 
             FROM leave_requests lr
             JOIN employees e ON lr.employee_id = e.employee_id
             WHERE e.department = ? AND lr.status = 'Pending'`,
            [deptName]
        );

        // 4. Tasks Stats (Active vs Completed)
        const [[{ activeTasks }]] = await db.promise().query(
            "SELECT COUNT(*) AS activeTasks FROM tasks WHERE department = ? AND status != 'Completed'",
            [deptName]
        );

        const [[{ completedTasks }]] = await db.promise().query(
            "SELECT COUNT(*) AS completedTasks FROM tasks WHERE department = ? AND status = 'Completed'",
            [deptName]
        );

        // 5. Recent Activity Feed (Aggregation)
        const activities = [];

        // - Attendance logs
        const [attendanceLogs] = await db.promise().query(
            `SELECT a.check_in, a.check_out, a.working_hours, a.status, e.first_name, e.last_name, a.created_at
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE e.department = ? AND a.attendance_date = ?
             ORDER BY a.check_in DESC LIMIT 5`,
            [deptName, todayStr]
        );

        attendanceLogs.forEach(log => {
            // Check-in activity
            activities.push({
                text: `${log.first_name} ${log.last_name} checked in (${log.status})`,
                time: log.check_in,
                timestamp: new Date(`${todayStr}T${log.check_in}`).getTime(),
                type: "attendance"
            });
            // Check-out activity if occurred
            if (log.check_out) {
                activities.push({
                    text: `${log.first_name} ${log.last_name} checked out (worked ${log.working_hours})`,
                    time: log.check_out,
                    timestamp: new Date(`${todayStr}T${log.check_out}`).getTime(),
                    type: "checkout"
                });
            }
        });

        // - Leave requests logs
        const [leaveLogs] = await db.promise().query(
            `SELECT lr.created_at, lr.status, e.first_name, e.last_name, lt.name AS leave_type, lr.updated_at
             FROM leave_requests lr
             JOIN employees e ON lr.employee_id = e.employee_id
             JOIN leave_types lt ON lr.leave_type_id = lt.id
             WHERE e.department = ?
             ORDER BY lr.created_at DESC LIMIT 5`,
            [deptName]
        );

        leaveLogs.forEach(log => {
            const dateObj = new Date(log.created_at);
            activities.push({
                text: `${log.first_name} ${log.last_name} submitted a ${log.leave_type} request`,
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: dateObj.getTime(),
                type: "leave"
            });
        });

        // - Task updates
        const [taskLogs] = await db.promise().query(
            `SELECT t.task_title, t.status, t.updated_at, CONCAT(e.first_name, ' ', e.last_name) AS emp_name
             FROM tasks t
             JOIN employees e ON t.employee_id = e.employee_id
             WHERE t.department = ?
             ORDER BY t.updated_at DESC LIMIT 5`,
            [deptName]
        );

        taskLogs.forEach(log => {
            const dateObj = new Date(log.updated_at);
            const statusText = log.status === "Completed" ? "completed" : `marked task as '${log.status}'`;
            activities.push({
                text: `${log.emp_name} ${statusText} for task: "${log.task_title}"`,
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: dateObj.getTime(),
                type: "task"
            });
        });

        // Sort combined activity logs by timestamp DESC
        activities.sort((a, b) => b.timestamp - a.timestamp);
        const finalActivities = activities.slice(0, 10); // Keep top 10

        // 6. Attendance Trend for this department (Rolling last 5 working days ending today)
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
                `SELECT COUNT(*) AS count 
                 FROM attendance a
                 JOIN employees e ON a.employee_id = e.employee_id
                 WHERE e.department = ? AND a.attendance_date = ? AND a.status IN ('Present', 'Late', 'Half Day')`,
                [deptName, dateStr]
            );
            trendData.push(count || 0);
        }

        // 7. Project Progress & Deliverables
        const [deptRows] = await db.promise().query("SELECT id FROM departments WHERE department_name = ?", [deptName]);
        const deptId = deptRows.length ? deptRows[0].id : -1;
        
        let [projects] = await db.promise().query(
            `SELECT id, project_name, project_code, status, priority, completion_percentage, end_date, start_date, project_color 
             FROM projects WHERE department_id = ? OR manager_id = ? ORDER BY created_at DESC LIMIT 6`,
            [deptId, emp.employee_id]
        );

        let projectProgress = [];
        let departmentProjects = [];
        let totalProj = 0;
        let activeProj = 0;
        let completedProj = 0;
        let avgProg = 0;

        if (projects.length > 0) {
            departmentProjects = projects;
            projectProgress = projects.slice(0, 4).map(p => ({
                name: p.project_name,
                progress: p.completion_percentage || 0
            }));

            const [[pStats]] = await db.promise().query(
                `SELECT COUNT(*) as total,
                        SUM(IF(status != 'Completed', 1, 0)) as active,
                        SUM(IF(status = 'Completed', 1, 0)) as completed,
                        AVG(IFNULL(completion_percentage, 0)) as avgProgress
                 FROM projects WHERE department_id = ? OR manager_id = ?`,
                [deptId, emp.employee_id]
            );
            totalProj = pStats.total || 0;
            activeProj = pStats.active || 0;
            completedProj = pStats.completed || 0;
            avgProg = Math.round(pStats.avgProgress || 0);
        } else {
            // Fallback: Use department tasks as active deliverables if no projects exist yet
            const [deptTasks] = await db.promise().query(
                `SELECT id, task_title as project_name, CONCAT('TSK-', id) as project_code, status, priority, 
                        IF(status='Completed', 100, IF(status='In Progress', 60, 20)) as completion_percentage, 
                        deadline as end_date, created_at as start_date, '#3b82f6' as project_color 
                 FROM tasks WHERE department = ? ORDER BY created_at DESC LIMIT 6`,
                [deptName]
            );
            if (deptTasks.length > 0) {
                departmentProjects = deptTasks;
                projectProgress = deptTasks.slice(0, 4).map(t => ({
                    name: t.project_name,
                    progress: t.completion_percentage
                }));
                totalProj = deptTasks.length;
                activeProj = deptTasks.filter(t => t.status !== 'Completed').length;
                completedProj = deptTasks.filter(t => t.status === 'Completed').length;
                const sumProg = deptTasks.reduce((acc, t) => acc + t.completion_percentage, 0);
                avgProg = Math.round(sumProg / deptTasks.length);
            }
        }

        return res.status(200).json({
            success: true,
            departmentInfo: {
                departmentName: deptName,
                managerName: managerName,
                teamSize: employeeCount,
                attendanceRate: attendancePercentage
            },
            widgets: {
                presentToday: presentCount,
                lateToday: lateCount,
                absentToday: absentCount,
                pendingLeaves: pendingLeaves,
                activeTasks: activeTasks,
                completedTasks: completedTasks
            },
            projectStats: {
                total: totalProj,
                active: activeProj,
                completed: completedProj,
                avgProgress: avgProg
            },
            departmentProjects: departmentProjects,
            activities: finalActivities,
            attendanceTrend: {
                labels: trendLabels,
                data: trendData
            },
            projectProgress: projectProgress
        });

    } catch (error) {
        console.error("Manager dashboard API error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch manager dashboard stats."
        });
    }
};

module.exports = {
    getManagerDashboardInfo
};
