const db = require("../config/db");

const getEmployeeDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user account info
        const [users] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const user = users[0];

        // Fetch employee personal details
        const [employees] = await db.promise().query(
            "SELECT * FROM employees WHERE email = ?",
            [user.email]
        );
        const emp = employees[0] || {};
        const employeeId = emp.employee_id || user.login_id;

        // --- Today's Attendance ---
        const todayDate = new Date().toISOString().split("T")[0];
        const [todayAtt] = await db.promise().query(
            `SELECT check_in, check_out, working_hours, status 
             FROM attendance 
             WHERE employee_id = ? AND DATE(attendance_date) = ?`,
            [employeeId, todayDate]
        );
        const todayAttRecord = todayAtt[0] || null;

        // Calculate working hours so far if checked in but not out
        let workingHoursDecimal = 0;
        let workingHoursDisplay = "0h 0m";
        if (todayAttRecord) {
            if (todayAttRecord.working_hours) {
                const parts = todayAttRecord.working_hours.split(":");
                const hours = parseInt(parts[0]) || 0;
                const mins = parseInt(parts[1]) || 0;
                workingHoursDecimal = parseFloat((hours + mins / 60).toFixed(1));
                workingHoursDisplay = `${hours}h ${mins}m`;
            } else if (todayAttRecord.check_in) {
                // still checked in — compute elapsed time
                const now = new Date();
                const checkInTime = new Date(`${todayDate}T${todayAttRecord.check_in}`);
                const diffMs = now - checkInTime;
                const diffMins = Math.floor(diffMs / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                workingHoursDecimal = parseFloat((hours + mins / 60).toFixed(1));
                workingHoursDisplay = `${hours}h ${mins}m`;
            }
        }

        // Standard working hours (8h = 100%)
        const maxHours = 8;
        const workingPercent = Math.min(100, Math.round((workingHoursDecimal / maxHours) * 100));

        // --- Leave Balance ---
        const currentYear = new Date().getFullYear();
        const [leaveSummary] = await db.promise().query(
            `SELECT 
                COALESCE(SUM(CASE WHEN status = 'Approved' AND YEAR(start_date) = ? THEN total_days ELSE 0 END), 0) AS days_taken
             FROM leave_requests 
             WHERE employee_id = ?`,
            [currentYear, employeeId]
        );
        const annualAllowance = 20;
        const daysTaken = parseInt(leaveSummary[0]?.days_taken) || 0;
        const leaveBalance = Math.max(0, annualAllowance - daysTaken);

        // --- My Tasks (active tasks assigned to this employee) ---
        const [tasks] = await db.promise().query(
            `SELECT id, task_id, task_title, description, priority, deadline, status, department
             FROM tasks
             WHERE employee_id = ? AND status NOT IN ('Completed', 'Cancelled')
             ORDER BY 
                CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
                deadline ASC
             LIMIT 5`,
            [employeeId]
        );

        const formattedTasks = tasks.map(t => {
            let deadlineDisplay = "";
            if (t.deadline) {
                const dl = new Date(t.deadline);
                const today = new Date();
                const isToday = dl.toDateString() === today.toDateString();
                if (isToday) {
                    deadlineDisplay = `Today, ${dl.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                } else {
                    deadlineDisplay = dl.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }
            }
            return {
                id: t.id,
                task_id: t.task_id,
                title: t.task_title,
                department: t.department || "",
                priority: t.priority || "Low",
                deadline: deadlineDisplay,
                status: t.status
            };
        });


        // --- 14-Day Attendance Heatmap ---
        const heatmapDays = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            heatmapDays.push(d.toISOString().split("T")[0]);
        }

        const [heatmapRows] = await db.promise().query(
            `SELECT DATE(attendance_date) as att_date, working_hours, status
             FROM attendance
             WHERE employee_id = ? AND DATE(attendance_date) >= ?
             ORDER BY attendance_date ASC`,
            [employeeId, heatmapDays[0]]
        );

        const heatmapMap = {};
        heatmapRows.forEach(r => {
            const key = new Date(r.att_date).toISOString().split("T")[0];
            heatmapMap[key] = { working_hours: r.working_hours, status: r.status };
        });

        const heatmap = heatmapDays.map(dateStr => {
            const d = new Date(dateStr + "T00:00:00");
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const record = heatmapMap[dateStr];
            let level = 0;
            let label = isWeekend ? "Weekend" : "Absent";
            let isLeave = false;

            if (record) {
                if (record.status === "Present") {
                    const parts = (record.working_hours || "0:0:0").split(":");
                    const hrs = parseInt(parts[0]) || 0;
                    if (hrs >= 9) level = 4;
                    else if (hrs >= 8) level = 3;
                    else if (hrs >= 6) level = 2;
                    else level = 1;
                    label = `${hrs}h worked`;
                } else if (record.status === "Half Day") {
                    level = 1;
                    label = "Half Day";
                } else if (record.status && record.status.toLowerCase().includes("leave")) {
                    isLeave = true;
                    label = record.status;
                }
            }

            return {
                date: dateStr,
                level,
                isWeekend,
                isLeave,
                label
            };
        });

        // --- Upcoming Events (pending leave requests as upcoming) ---
        const [upcoming] = await db.promise().query(
            `SELECT lr.reason, lr.start_date, lt.name AS leave_type_name, lr.status
             FROM leave_requests lr
             JOIN leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.employee_id = ? AND lr.start_date >= CURDATE() AND lr.status = 'Pending'
             ORDER BY lr.start_date ASC
             LIMIT 3`,
            [employeeId]
        );

        const upcomingEvents = upcoming.map(e => ({
            title: `${e.leave_type_name} Leave`,
            date: new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            status: e.status
        }));

        // Fetch manager for the department
        let managerName = "Anish Kumar"; // Default fallback
        if (emp.department) {
            const [managers] = await db.promise().query(
                `SELECT e.first_name, e.last_name 
                 FROM employees e 
                 JOIN users u ON e.email = u.email 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE e.department = ? AND r.role_name = 'Manager' 
                 LIMIT 1`,
                [emp.department]
            );
            if (managers.length > 0) {
                managerName = `${managers[0].first_name} ${managers[0].last_name}`;
            }
        }

        // Fetch direct team members (employees in the same department, excluding current employee)
        let teamMembers = [];
        if (emp.department) {
            const [members] = await db.promise().query(
                `SELECT first_name, last_name, designation 
                 FROM employees 
                 WHERE department = ? AND employee_id != ? 
                 LIMIT 5`,
                [emp.department, employeeId]
            );
            teamMembers = members.map(m => ({
                name: `${m.first_name} ${m.last_name}`,
                designation: m.designation,
                initials: `${m.first_name.charAt(0).toUpperCase()}${m.last_name.charAt(0).toUpperCase()}`
            }));
        }
        if (teamMembers.length === 0) {
            teamMembers = [
                { name: "Priya Kapoor", designation: "Frontend Developer", initials: "PK" },
                { name: "Rahul Gupta", designation: "Backend Engineer", initials: "RG" }
            ];
        }

        // Fetch real attendance activity
        const [attActivities] = await db.promise().query(
            `SELECT attendance_date, check_in, status 
             FROM attendance 
             WHERE employee_id = ? 
             ORDER BY attendance_date DESC 
             LIMIT 3`,
            [employeeId]
        );

        // Fetch real leave request activity
        const [leaveActivities] = await db.promise().query(
            `SELECT start_date, status, reason 
             FROM leave_requests 
             WHERE employee_id = ? 
             ORDER BY created_at DESC 
             LIMIT 3`,
            [employeeId]
        );

        // Fetch real task completion activity
        const [taskActivities] = await db.promise().query(
            `SELECT task_title, status, deadline, updated_at 
             FROM tasks 
             WHERE employee_id = ? 
             ORDER BY updated_at DESC, id DESC 
             LIMIT 3`,
            [employeeId]
        );

        const activities = [];
        
        attActivities.forEach(a => {
            if (a.attendance_date) {
                const dateObj = new Date(a.attendance_date);
                const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                activities.push({
                    action: `Clocked In successfully (${a.status})`,
                    time: `${dateStr} at ${a.check_in || '09:00 AM'}`,
                    icon: "fingerprint",
                    color: "#22c55e",
                    timestamp: dateObj
                });
            }
        });

        leaveActivities.forEach(l => {
            if (l.start_date) {
                const dateObj = new Date(l.start_date);
                const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                activities.push({
                    action: `Applied for Leave: ${l.reason || 'Personal'} (${l.status})`,
                    time: `Starts on ${dateStr}`,
                    icon: "event_available",
                    color: l.status === 'Approved' ? "#004ac6" : l.status === 'Rejected' ? "#ef4444" : "#f59e0b",
                    timestamp: dateObj
                });
            }
        });

        taskActivities.forEach(t => {
            activities.push({
                action: `${t.status === 'Completed' ? 'Completed' : 'Updated'} task '${t.task_title}'`,
                time: t.deadline ? `Due by ${new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : 'No deadline',
                icon: "task_alt",
                color: "#a855f7",
                timestamp: t.updated_at ? new Date(t.updated_at) : new Date()
            });
        });

        // Sort activities by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);
        const finalActivities = activities.slice(0, 5).map(act => ({
            action: act.action,
            time: act.time,
            icon: act.icon,
            color: act.color
        }));

        // --- My Projects & Department Deliverables ---
        const [deptRows] = await db.promise().query("SELECT id FROM departments WHERE department_name = ?", [emp.department || ""]);
        const deptId = deptRows.length ? deptRows[0].id : -1;

        let [projects] = await db.promise().query(
            `SELECT DISTINCT p.id, p.project_name, p.project_code, p.status, p.priority, p.completion_percentage, p.end_date, p.start_date, p.project_color, p.description
             FROM projects p
             LEFT JOIN project_members pm ON p.id = pm.project_id
             WHERE p.department_id = ? OR pm.employee_id = ? OR pm.employee_id = ? OR pm.employee_id = ?
             ORDER BY p.created_at DESC LIMIT 6`,
            [deptId, employeeId, emp.id || -1, emp.employee_id || -1]
        );

        if (projects.length === 0 && emp.department) {
            // Fallback: Use employee's tasks or department tasks if no formal project is assigned
            const [fallbackTasks] = await db.promise().query(
                `SELECT id, task_title as project_name, CONCAT('TSK-', id) as project_code, status, priority, 
                        IF(status='Completed', 100, IF(status='In Progress', 60, 20)) as completion_percentage, 
                        deadline as end_date, created_at as start_date, '#3b82f6' as project_color, description 
                 FROM tasks WHERE employee_id = ? OR department = ? ORDER BY created_at DESC LIMIT 6`,
                [employeeId, emp.department]
            );
            if (fallbackTasks.length > 0) {
                projects = fallbackTasks;
            }
        }

        return res.status(200).json({
            success: true,
            employee: {
                name: emp.first_name ? `${emp.first_name} ${emp.last_name}` : user.name,
                first_name: emp.first_name || user.name,
                last_name: emp.last_name || "",
                employee_id: employeeId,
                department: emp.department || "N/A",
                designation: emp.designation || "N/A",
                email: emp.email || user.email,
                phone: emp.mobile || "N/A",
                gender: emp.gender || "Prefer not to say",
                employment_type: emp.employment_type || "Full-Time",
                joining_date: emp.joining_date || null,
                salary: emp.salary || null,
                manager_name: managerName,
                personal_email: emp.personal_email || emp.email || user.email,
                location: emp.location || "Mumbai, India",
                date_of_birth: emp.date_of_birth ? (() => {
                    const d = new Date(emp.date_of_birth);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                })() : "1995-06-14",
                probation_period: emp.probation_period || "Completed",
                expertise: emp.expertise || "System Architect, Node.js, Tailwind CSS, React, Cloud Infrastructure"
            },
            team: teamMembers,
            activities: finalActivities,
            todayAttendance: {
                status: todayAttRecord?.status || "Not Checked In",
                checkIn: todayAttRecord?.check_in || null,
                checkOut: todayAttRecord?.check_out || null,
                isCheckedIn: !!todayAttRecord?.check_in && !todayAttRecord?.check_out
            },
            workingHours: {
                decimal: workingHoursDecimal,
                display: workingHoursDisplay,
                percent: workingPercent,
                max: maxHours
            },
            leaveBalance: {
                remaining: leaveBalance,
                total: annualAllowance,
                taken: daysTaken
            },
            tasks: formattedTasks,
            projects: projects || [],
            heatmap,
            upcomingEvents
        });

    } catch (error) {
        console.error("Employee dashboard controller error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
    }
};

module.exports = { getEmployeeDashboard };
