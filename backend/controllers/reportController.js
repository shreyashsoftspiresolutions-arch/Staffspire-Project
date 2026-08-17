const db = require("../config/db");
const { generateCSV } = require("../utils/csvGenerator");
const { generateExcel } = require("../utils/excelGenerator");
const { generatePDF } = require("../utils/pdfGenerator");

// Helper: Get employee info from logged-in user
const getEmployeeFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (!users.length) return null;
    const [emps] = await db.promise().query("SELECT * FROM employees WHERE email = ?", [users[0].email]);
    return emps.length ? emps[0] : null;
};

// Apply access restrictions based on role
const applyRoleFilters = async (req, whereParts, params, tableAlias = "e") => {
    const role = req.user.role;
    if (role === "Manager") {
        const emp = await getEmployeeFromUser(req.user.id);
        if (emp) {
            whereParts.push(`${tableAlias}.department = ?`);
            params.push(emp.department);
            return { department: emp.department };
        }
    } else if (role === "Employee") {
        const emp = await getEmployeeFromUser(req.user.id);
        if (emp) {
            whereParts.push(`${tableAlias}.employee_id = ?`);
            params.push(emp.employee_id);
            return { employee_id: emp.employee_id };
        }
    }
    return {};
};

// 1. GET /api/reports/employees
const getEmployeeReport = async (req, res) => {
    try {
        const { department, status, employment_type, from, to, search, sort = "DESC" } = req.query;
        let whereParts = ["1=1"];
        let params = [];

        await applyRoleFilters(req, whereParts, params, "e");

        if (department) {
            whereParts.push("e.department = ?");
            params.push(department);
        }
        if (status) {
            whereParts.push("e.status = ?");
            params.push(status);
        }
        if (employment_type) {
            whereParts.push("e.employment_type = ?");
            params.push(employment_type);
        }
        if (from && to) {
            whereParts.push("e.joining_date BETWEEN ? AND ?");
            params.push(from, to);
        }
        if (search) {
            whereParts.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.designation LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const orderClause = sort === "ASC" ? "ASC" : "DESC";

        const sql = `
            SELECT e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS name, 
                   e.department, e.designation, e.email, e.mobile, e.joining_date, 
                   e.employment_type, e.status
            FROM employees e
            WHERE ${whereParts.join(" AND ")}
            ORDER BY e.joining_date ${orderClause}
        `;

        const [rows] = await db.promise().query(sql, params);

        // Calculate statistics based on filtered data (or overall if requested, let's base it on queried rows)
        const totalEmployees = rows.length;
        const activeEmployees = rows.filter(r => r.status === "Active").length;
        const inactiveEmployees = rows.filter(r => r.status === "Inactive").length;

        const deptCounts = {};
        rows.forEach(r => {
            if (r.department) {
                deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
            }
        });

        return res.status(200).json({
            success: true,
            data: rows,
            stats: {
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                departmentWiseCount: deptCounts
            }
        });
    } catch (error) {
        console.error("Employee report error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate Employee Report." });
    }
};

// 2. GET /api/reports/attendance
const getAttendanceReport = async (req, res) => {
    try {
        const { employee, department, from, to, month, year, search, sort = "DESC" } = req.query;
        let whereParts = ["1=1"];
        let params = [];

        await applyRoleFilters(req, whereParts, params, "e");

        if (employee) {
            whereParts.push("e.employee_id = ?");
            params.push(employee);
        }
        if (department) {
            whereParts.push("e.department = ?");
            params.push(department);
        }
        if (from && to) {
            whereParts.push("a.attendance_date BETWEEN ? AND ?");
            params.push(from, to);
        }
        if (month) {
            whereParts.push("MONTH(a.attendance_date) = ?");
            params.push(month);
        }
        if (year) {
            whereParts.push("YEAR(a.attendance_date) = ?");
            params.push(year);
        }
        if (search) {
            whereParts.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const orderClause = sort === "ASC" ? "ASC" : "DESC";

        const sql = `
            SELECT a.attendance_date AS date, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                   e.department, a.check_in, a.check_out, a.working_hours, a.status AS attendance_status
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE ${whereParts.join(" AND ")}
            ORDER BY a.attendance_date ${orderClause}
        `;

        const [rows] = await db.promise().query(sql, params);

        const totalDays = rows.length;
        const presentDays = rows.filter(r => r.attendance_status === "Present").length;
        const absentDays = rows.filter(r => r.attendance_status === "Absent").length;
        const lateDays = rows.filter(r => r.attendance_status === "Late").length;
        const halfDays = rows.filter(r => r.attendance_status === "Half Day").length;
        
        const attendancePercentage = totalDays > 0 
            ? Math.round(((presentDays + lateDays + (halfDays * 0.5)) / totalDays) * 100) 
            : 0;

        return res.status(200).json({
            success: true,
            data: rows,
            stats: {
                presentDays,
                absentDays,
                lateDays,
                halfDays,
                attendancePercentage
            }
        });
    } catch (error) {
        console.error("Attendance report error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate Attendance Report." });
    }
};

// 3. GET /api/reports/leaves
const getLeaveReport = async (req, res) => {
    try {
        const { department, employee, leave_type, status, from, to, search, sort = "DESC" } = req.query;
        let whereParts = ["1=1"];
        let params = [];

        await applyRoleFilters(req, whereParts, params, "e");

        if (employee) {
            whereParts.push("e.employee_id = ?");
            params.push(employee);
        }
        if (department) {
            whereParts.push("e.department = ?");
            params.push(department);
        }
        if (leave_type) {
            whereParts.push("(lt.name = ? OR lt.id = ?)");
            params.push(leave_type, leave_type);
        }
        if (status) {
            whereParts.push("lr.status = ?");
            params.push(status);
        }
        if (from && to) {
            whereParts.push("lr.start_date BETWEEN ? AND ?");
            params.push(from, to);
        }
        if (search) {
            whereParts.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const orderClause = sort === "ASC" ? "ASC" : "DESC";

        const sql = `
            SELECT lr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee,
                   e.department, lt.name AS leave_type, lr.start_date, lr.end_date, 
                   lr.total_days, lr.status, lr.rejection_remarks
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.employee_id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE ${whereParts.join(" AND ")}
            ORDER BY lr.start_date ${orderClause}
        `;

        const [rows] = await db.promise().query(sql, params);

        const totalRequests = rows.length;
        const approved = rows.filter(r => r.status === "Approved").length;
        const pending = rows.filter(r => r.status === "Pending").length;
        const rejected = rows.filter(r => r.status === "Rejected").length;

        return res.status(200).json({
            success: true,
            data: rows,
            stats: {
                totalRequests,
                approved,
                pending,
                rejected
            }
        });
    } catch (error) {
        console.error("Leave report error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate Leave Report." });
    }
};

// 4. GET /api/reports/tasks
const getTaskReport = async (req, res) => {
    try {
        const { employee, department, priority, status, from, to, search, sort = "DESC" } = req.query;
        let whereParts = ["1=1"];
        let params = [];

        await applyRoleFilters(req, whereParts, params, "e");

        if (employee) {
            whereParts.push("e.employee_id = ?");
            params.push(employee);
        }
        if (department) {
            whereParts.push("t.department = ?");
            params.push(department);
        }
        if (priority) {
            whereParts.push("t.priority = ?");
            params.push(priority);
        }
        if (status) {
            if (status === "Overdue") {
                whereParts.push("t.status NOT IN ('Completed') AND t.deadline < CURDATE()");
            } else {
                whereParts.push("t.status = ?");
                params.push(status);
            }
        }
        if (from && to) {
            whereParts.push("t.created_at BETWEEN ? AND ?");
            params.push(from, to);
        }
        if (search) {
            whereParts.push("(t.task_title LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)");
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const orderClause = sort === "ASC" ? "ASC" : "DESC";

        const sql = `
            SELECT t.task_id, t.task_title, CONCAT(e.first_name, ' ', e.last_name) AS assigned_employee,
                   t.assigned_by, t.priority, t.deadline AS due_date, t.created_at AS start_date, t.status
            FROM tasks t
            LEFT JOIN employees e ON t.employee_id = e.employee_id
            WHERE ${whereParts.join(" AND ")}
            ORDER BY t.created_at ${orderClause}
        `;

        const [rows] = await db.promise().query(sql, params);

        const processedRows = rows.map(task => {
            // Apply dynamic Overdue status check
            if (task.status !== "Completed" && task.due_date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadline = new Date(task.due_date);
                deadline.setHours(0, 0, 0, 0);
                if (deadline < today) {
                    return { ...task, status: "Overdue" };
                }
            }
            return task;
        });

        const totalTasks = processedRows.length;
        const pending = processedRows.filter(r => r.status === "Pending").length;
        const inProgress = processedRows.filter(r => r.status === "In Progress").length;
        const completed = processedRows.filter(r => r.status === "Completed").length;
        const overdue = processedRows.filter(r => r.status === "Overdue").length;

        return res.status(200).json({
            success: true,
            data: processedRows,
            stats: {
                totalTasks,
                pending,
                inProgress,
                completed,
                overdue
            }
        });
    } catch (error) {
        console.error("Task report error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate Task Report." });
    }
};

// 5. GET /api/reports/departments
const getDepartmentReport = async (req, res) => {
    try {
        const { department } = req.query;
        let whereParts = ["1=1"];
        let params = [];

        // Check restriction
        const role = req.user.role;
        if (role === "Manager") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) {
                whereParts.push("d.department_name = ?");
                params.push(emp.department);
            }
        } else if (role === "Employee") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        if (department && role !== "Manager") {
            whereParts.push("d.department_name = ?");
            params.push(department);
        }

        // Fetch all departments that match the filter
        const [depts] = await db.promise().query(
            `SELECT d.id, d.department_name FROM departments d WHERE ${whereParts.join(" AND ")}`,
            params
        );

        const reports = [];
        const todayStr = new Date().toLocaleDateString('sv');

        for (const d of depts) {
            // Count employees in department
            const [empRows] = await db.promise().query(
                "SELECT COUNT(*) AS count FROM employees WHERE department = ?",
                [d.department_name]
            );
            const employeeCount = empRows[0].count;

            // Find department head (Manager in that department)
            const [headRows] = await db.promise().query(
                `SELECT CONCAT(e.first_name, ' ', e.last_name) AS name 
                 FROM employees e
                 JOIN users u ON e.email = u.email
                 JOIN roles r ON u.role_id = r.id
                 WHERE e.department = ? AND r.role_name = 'Manager' LIMIT 1`,
                [d.department_name]
            );
            const departmentHead = headRows.length ? headRows[0].name : "Not Assigned";

            // Present today
            const [presentRows] = await db.promise().query(
                `SELECT COUNT(DISTINCT a.employee_id) AS count 
                 FROM attendance a
                 JOIN employees e ON a.employee_id = e.employee_id
                 WHERE e.department = ? AND a.attendance_date = ? AND a.status IN ('Present', 'Late')`,
                [d.department_name, todayStr]
            );
            const presentToday = presentRows[0].count;

            // Absent today
            const absentToday = Math.max(0, employeeCount - presentToday);

            // Active tasks (status not Completed)
            const [taskRows] = await db.promise().query(
                "SELECT COUNT(*) AS count FROM tasks WHERE department = ? AND status != 'Completed'",
                [d.department_name]
            );
            const activeTasks = taskRows[0].count;

            // Pending leaves
            const [leaveRows] = await db.promise().query(
                `SELECT COUNT(*) AS count 
                 FROM leave_requests lr
                 JOIN employees e ON lr.employee_id = e.employee_id
                 WHERE e.department = ? AND lr.status = 'Pending'`,
                [d.department_name]
            );
            const pendingLeaves = leaveRows[0].count;

            // Calculate ratios
            const attendancePercentage = employeeCount > 0 ? Math.round((presentToday / employeeCount) * 100) : 0;
            // Let's count currently on approved leaves / employees
            const [onLeaveRows] = await db.promise().query(
                `SELECT COUNT(DISTINCT lr.employee_id) AS count 
                 FROM leave_requests lr
                 JOIN employees e ON lr.employee_id = e.employee_id
                 WHERE e.department = ? AND lr.status = 'Approved' AND ? BETWEEN lr.start_date AND lr.end_date`,
                [d.department_name, todayStr]
            );
            const onLeaveCount = onLeaveRows[0].count;
            const leavePercentage = employeeCount > 0 ? Math.round((onLeaveCount / employeeCount) * 100) : 0;

            reports.push({
                department: d.department_name,
                department_head: departmentHead,
                employees: employeeCount,
                present_today: presentToday,
                absent_today: absentToday,
                active_tasks: activeTasks,
                pending_leaves: pendingLeaves,
                attendance_percentage: attendancePercentage,
                leave_percentage: leavePercentage
            });
        }

        // Summary totals
        const totalEmployees = reports.reduce((acc, curr) => acc + curr.employees, 0);
        const avgAttendance = reports.length > 0 ? Math.round(reports.reduce((acc, curr) => acc + curr.attendance_percentage, 0) / reports.length) : 0;
        const avgLeaves = reports.length > 0 ? Math.round(reports.reduce((acc, curr) => acc + curr.leave_percentage, 0) / reports.length) : 0;

        return res.status(200).json({
            success: true,
            data: reports,
            stats: {
                employeeCount: totalEmployees,
                attendancePercentage: avgAttendance,
                leavePercentage: avgLeaves
            }
        });
    } catch (error) {
        console.error("Department report error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate Department Summary Report." });
    }
};

// Generic helper function to get data rows for exports
const getExportData = async (req, type, filters) => {
    // We can simulate req.query and call the internal controller functions to get rows
    const mockReq = { 
        user: req.user,
        query: { ...filters, sort: "DESC" } 
    };

    let result = [];
    let headers = [];
    let keys = [];
    let title = "";

    if (type === "employees") {
        const mockRes = {
            status: () => ({
                json: (data) => { result = data.data; }
            })
        };
        await getEmployeeReport(mockReq, mockRes);
        headers = ["Employee ID", "Name", "Department", "Designation", "Email", "Mobile", "Joining Date", "Employment Type", "Status"];
        keys = ["employee_id", "name", "department", "designation", "email", "mobile", "joining_date", "employment_type", "status"];
        title = "Employee Registry Report";
    } else if (type === "attendance") {
        const mockRes = {
            status: () => ({
                json: (data) => { result = data.data; }
            })
        };
        await getAttendanceReport(mockReq, mockRes);
        headers = ["Date", "Employee ID", "Employee Name", "Department", "Check In", "Check Out", "Working Hours", "Status"];
        keys = ["date", "employee_id", "employee_name", "department", "check_in", "check_out", "working_hours", "attendance_status"];
        title = "Attendance Registry Report";
    } else if (type === "leaves") {
        const mockRes = {
            status: () => ({
                json: (data) => { result = data.data; }
            })
        };
        await getLeaveReport(mockReq, mockRes);
        headers = ["Employee ID", "Employee Name", "Department", "Leave Type", "Start Date", "End Date", "Total Days", "Status"];
        keys = ["employee_id", "employee", "department", "leave_type", "start_date", "end_date", "total_days", "status"];
        title = "Leave Request Registry Report";
    } else if (type === "tasks") {
        const mockRes = {
            status: () => ({
                json: (data) => { result = data.data; }
            })
        };
        await getTaskReport(mockReq, mockRes);
        headers = ["Task ID", "Task Title", "Assigned Employee", "Assigned By", "Priority", "Due Date", "Start Date", "Status"];
        keys = ["task_id", "task_title", "assigned_employee", "assigned_by", "priority", "due_date", "start_date", "status"];
        title = "Task Management Report";
    } else if (type === "departments") {
        const mockRes = {
            status: () => ({
                json: (data) => { result = data.data; }
            })
        };
        await getDepartmentReport(mockReq, mockRes);
        headers = ["Department", "Department Head", "Employees", "Present Today", "Absent Today", "Active Tasks", "Pending Leaves"];
        keys = ["department", "department_head", "employees", "present_today", "absent_today", "active_tasks", "pending_leaves"];
        title = "Department Summary Report";
    }

    return { result, headers, keys, title };
};

// 6. GET /api/reports/export/csv
const exportCSV = async (req, res) => {
    try {
        const { type, ...filters } = req.query;
        if (req.user.role === "Employee") {
            return res.status(403).json({ success: false, message: "Employees are not permitted to export organization-wide reports." });
        }

        const { result, headers, keys, title } = await getExportData(req, type, filters);

        const csvContent = generateCSV(headers, keys, result);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${type}_report.csv"`);
        return res.send(csvContent);
    } catch (error) {
        console.error("CSV Export error:", error);
        return res.status(500).json({ success: false, message: "CSV Export failed." });
    }
};

// 7. GET /api/reports/export/excel
const exportExcel = async (req, res) => {
    try {
        const { type, ...filters } = req.query;
        if (req.user.role === "Employee") {
            return res.status(403).json({ success: false, message: "Employees are not permitted to export organization-wide reports." });
        }

        const { result, headers, keys, title } = await getExportData(req, type, filters);

        await generateExcel(res, title, headers, keys, result, `${type}_report.xlsx`);
    } catch (error) {
        console.error("Excel Export error:", error);
        return res.status(500).json({ success: false, message: "Excel Export failed." });
    }
};

// 8. GET /api/reports/export/pdf
const exportPDF = async (req, res) => {
    try {
        const { type, ...filters } = req.query;
        if (req.user.role === "Employee") {
            return res.status(403).json({ success: false, message: "Employees are not permitted to export organization-wide reports." });
        }

        const { result, headers, keys, title } = await getExportData(req, type, filters);

        generatePDF(res, {
            reportTitle: title,
            generatedBy: "Authorized User",
            filters,
            headers,
            keys,
            rows: result,
            filename: `${type}_report.pdf`
        });
    } catch (error) {
        console.error("PDF Export error:", error);
        return res.status(500).json({ success: false, message: "PDF Export failed." });
    }
};

// 9. GET /api/reports/dashboard-stats
const getDashboardStats = async (req, res) => {
    try {
        const role = req.user.role;
        const todayStr = new Date().toLocaleDateString('sv');

        let empWhere = "1=1";
        let attWhere = "a.attendance_date = ? AND a.status IN ('Present', 'Late')";
        let leaveWhere = "lr.status = 'Pending'";
        let taskWhere = "t.status != 'Completed'";
        let params = [];
        let attParams = [todayStr];
        let leaveParams = [];
        let taskParams = [];

        if (role === "Manager") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) {
                empWhere = "department = ?";
                attWhere += " AND e.department = ?";
                leaveWhere += " AND e.department = ?";
                taskWhere += " AND t.department = ?";
                params.push(emp.department);
                attParams.push(emp.department);
                leaveParams.push(emp.department);
                taskParams.push(emp.department);
            }
        } else if (role === "Employee") {
            const emp = await getEmployeeFromUser(req.user.id);
            if (emp) {
                empWhere = "employee_id = ?";
                attWhere += " AND e.employee_id = ?";
                leaveWhere += " AND e.employee_id = ?";
                taskWhere += " AND t.employee_id = ?";
                params.push(emp.employee_id);
                attParams.push(emp.employee_id);
                leaveParams.push(emp.employee_id);
                taskParams.push(emp.employee_id);
            }
        }

        const [empCount] = await db.promise().query(`SELECT COUNT(*) AS count FROM employees WHERE ${empWhere}`, params);
        const [attCount] = await db.promise().query(
            `SELECT COUNT(DISTINCT a.employee_id) AS count FROM attendance a JOIN employees e ON a.employee_id = e.employee_id WHERE ${attWhere}`, 
            attParams
        );
        const [leaveCount] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM leave_requests lr JOIN employees e ON lr.employee_id = e.employee_id WHERE ${leaveWhere}`, 
            leaveParams
        );
        const [taskCount] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM tasks t WHERE ${taskWhere}`, 
            taskParams
        );
        const [deptCount] = await db.promise().query("SELECT COUNT(*) AS count FROM departments");

        return res.status(200).json({
            success: true,
            stats: {
                totalEmployees: empCount[0].count,
                presentToday: attCount[0].count,
                pendingLeaves: leaveCount[0].count,
                activeTasks: taskCount[0].count,
                departments: role === "Admin" ? deptCount[0].count : (role === "Manager" ? 1 : 0)
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({ success: false, message: "Failed to load dashboard stats." });
    }
};

module.exports = {
    getEmployeeReport,
    getAttendanceReport,
    getLeaveReport,
    getTaskReport,
    getDepartmentReport,
    getDashboardStats,
    exportCSV,
    exportExcel,
    exportPDF
};
