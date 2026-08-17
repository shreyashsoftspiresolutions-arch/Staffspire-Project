const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { encryptPassword, decryptPassword } = require("../utils/cryptoHelper");
const crypto = require("crypto");

const getManagerDepartment = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (!users.length) return null;
    const [emps] = await db.promise().query("SELECT department FROM employees WHERE email = ?", [users[0].email]);
    return emps.length ? emps[0].department : null;
};

const getEmployees = async (req, res) => {
    try {
        const role = req.user.role;
        let query = `
            SELECT e.*, r.role_name AS role
            FROM employees e
            LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email
            LEFT JOIN roles r ON u.role_id = r.id
        `;
        const params = [];
        if (role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (dept) {
                query = `
                    SELECT e.*, r.role_name AS role
                    FROM employees e
                    LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE e.department = ?
                `;
                params.push(dept);
            } else {
                return res.status(200).json({ success: true, employees: [] });
            }
        }

        const [results] = await db.promise().query(query, params);
        res.status(200).json({
            success: true,
            employees: results
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Database Error"
        });
    }
};


const generateUniqueEmployeeId = async () => {
    let isUnique = false;
    let employeeId = "";
    while (!isUnique) {
        const randNum = crypto.randomInt(1000, 10000);
        employeeId = `EM${randNum}SS`;
        const [rows] = await db.promise().query("SELECT id FROM employees WHERE employee_id = ?", [employeeId]);
        if (rows.length === 0) {
            isUnique = true;
        }
    }
    return employeeId;
};

const generateTempPassword = () => {
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = uppers + lowers + numbers;
    const length = crypto.randomInt(8, 11); // 8, 9, or 10 characters
    
    let password = [
        uppers[crypto.randomInt(0, uppers.length)],
        lowers[crypto.randomInt(0, lowers.length)],
        numbers[crypto.randomInt(0, numbers.length)]
    ];
    
    for (let i = 3; i < length; i++) {
        password.push(all[crypto.randomInt(0, all.length)]);
    }
    
    // Shuffle
    for (let i = password.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }
    
    return password.join("");
};

const createEmployee = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            mobile,
            gender,
            department,
            designation,
            salary,
            employment_type,
            start_date,
            role,
            custom_employee_id,
            custom_password,
            date_of_birth
        } = req.body;

        if (!first_name || !last_name || !email || !department || !designation) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const [existingUser] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        const [existingEmp] = await db.promise().query(
            "SELECT id FROM employees WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0 || existingEmp.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered"
            });
        }

        if (role === "Manager") {
            const [managers] = await db.promise().query(
                `SELECT e.id FROM employees e 
                 JOIN users u ON e.employee_id = u.login_id OR e.email = u.email 
                 WHERE e.department = ? AND u.role_id = 2`,
                [department]
            );
            if (managers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `The department/branch "${department}" already has a manager. Only one manager is allowed per department.`
                });
            }
        }
        // ── Employee ID: use custom or auto-generate ──────────────────────────
        let employeeId;
        if (custom_employee_id && custom_employee_id.trim()) {
            const cleanId = custom_employee_id.trim().toUpperCase();

            // Enforce EM####SS format
            if (!/^EM\d{4}SS$/.test(cleanId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Employee ID format. Must be EM + 4 digits + SS (e.g. EM1234SS)."
                });
            }

            // Check uniqueness in both employees table and users table
            const [idInEmp] = await db.promise().query(
                "SELECT id FROM employees WHERE employee_id = ?", [cleanId]
            );
            const [idInUser] = await db.promise().query(
                "SELECT id FROM users WHERE login_id = ?", [cleanId]
            );
            if (idInEmp.length > 0 || idInUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Employee ID "${cleanId}" is already taken. Please choose a different one.`
                });
            }
            employeeId = cleanId;
        } else {
            employeeId = await generateUniqueEmployeeId();
        }

        // ── Password: use custom or auto-generate ────────────────────────────
        let plainPassword;
        let isAutoGenerated = false;
        if (custom_password && custom_password.trim()) {
            plainPassword = custom_password.trim();
        } else {
            plainPassword = generateTempPassword();
            isAutoGenerated = true;
        }

        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const roleId = role === "Manager" ? 2 : 3;

        const insertEmpSql = `
            INSERT INTO employees (first_name, last_name, email, mobile, gender, department, designation, salary, employment_type, joining_date, employee_id, password, date_of_birth)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertUserSql = `
            INSERT INTO users (name, email, password, role_id, login_id, must_change_password)
            VALUES (?, ?, ?, ?, ?, 1)
        `;
        await db.promise().query(insertUserSql, [`${first_name} ${last_name}`, email, hashedPassword, roleId, employeeId]);
        const encryptedPassword = encryptPassword(plainPassword);
        await db.promise().query(insertEmpSql, [
            first_name, last_name, email,
            mobile || null, gender || null,
            department, designation,
            salary || null, employment_type || null,
            start_date || null,
            employeeId, encryptedPassword,
            date_of_birth || null
        ]);

        return res.status(201).json({
            success: true,
            message: "Employee Created Successfully",
            employeeId,
            temporaryPassword: plainPassword,
            isAutoGenerated
        });
    } catch (error) {
        console.error("CREATE EMPLOYEE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Database Error"
        });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.promise().query(
            `SELECT e.*, u.role_id, r.role_name AS role 
             FROM employees e 
             LEFT JOIN users u ON e.employee_id = u.login_id OR e.email = u.email 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE e.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const employee = rows[0];

        if (req.user.role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (employee.department !== dept) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Employee is not in your department."
                });
            }
        }

        if (employee && employee.date_of_birth) {
            const d = new Date(employee.date_of_birth);
            employee.date_of_birth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        res.status(200).json({
            success: true,
            employee
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const id = req.params.id;
        const [empRows] = await db.promise().query("SELECT * FROM employees WHERE id = ?", [id]);
        if (empRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        const employee = empRows[0];
        const role = req.user.role;

        if (role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (employee.department !== dept) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Employee is not in your department."
                });
            }

            // Block managers from modifying their own employee record
            const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [req.user.id]);
            const managerEmail = users.length ? users[0].email : null;
            if (managerEmail && employee.email && managerEmail.toLowerCase() === employee.email.toLowerCase()) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot modify your own profile. Please contact an Administrator."
                });
            }

            // Manager can only edit mobile, designation, status
            const { mobile, designation, status } = req.body;
            await db.promise().query(
                `UPDATE employees SET mobile = ?, designation = ?, status = ? WHERE id = ?`,
                [
                    mobile !== undefined ? mobile : employee.mobile,
                    designation !== undefined ? designation : employee.designation,
                    status !== undefined ? status : employee.status,
                    id
                ]
            );

            if (status !== undefined) {
                await db.promise().query(
                    `UPDATE users SET status = ? WHERE email = ?`,
                    [status, employee.email]
                );
            }
        } else {
            // Admin can edit everything
            const {
                first_name,
                last_name,
                email,
                department,
                designation,
                mobile,
                gender,
                salary,
                employment_type,
                status,
                role: userRole,
                date_of_birth,
                probation_period
            } = req.body;

            const [userRows] = await db.promise().query(
                "SELECT role_id FROM users WHERE email = ?",
                [employee.email]
            );
            const currentUserRoleId = userRows.length > 0 ? userRows[0].role_id : 3;
            const isNewRoleManager = userRole === "Manager" || (userRole === undefined && currentUserRoleId === 2);
            const targetDept = department !== undefined ? department : employee.department;

            if (targetDept !== employee.department) {
                const { taskAction, reassignTo } = req.body;
                
                const [activeTasks] = await db.promise().query(
                    `SELECT COUNT(*) as count FROM tasks WHERE employee_id = ? AND status NOT IN ('Completed', 'Cancelled')`,
                    [employee.employee_id]
                );
                const activeCount = activeTasks[0].count;

                const [completedTasks] = await db.promise().query(
                    `SELECT COUNT(*) as count FROM tasks WHERE employee_id = ? AND status = 'Completed'`,
                    [employee.employee_id]
                );
                const completedCount = completedTasks[0].count;

                if (activeCount > 0) {
                    if (!taskAction) {
                        return res.status(409).json({
                            success: false,
                            requireTaskAction: true,
                            employee: `${employee.first_name} ${employee.last_name}`,
                            oldDepartment: employee.department,
                            newDepartment: targetDept,
                            activeTasks: activeCount,
                            completedTasks: completedCount
                        });
                    }

                    if (taskAction === "reassign") {
                        if (!reassignTo) {
                            return res.status(400).json({ success: false, message: "Please select an employee to reassign tasks to." });
                        }
                        await db.promise().query(
                            `UPDATE tasks SET employee_id = ? WHERE employee_id = ? AND status NOT IN ('Completed', 'Cancelled')`,
                            [reassignTo, employee.employee_id]
                        );
                    }
                }
            }

            if (isNewRoleManager) {
                // Find if another employee is already a manager in the target department
                const [managers] = await db.promise().query(
                    `SELECT e.id FROM employees e 
                     JOIN users u ON e.employee_id = u.login_id OR e.email = u.email 
                     WHERE e.department = ? AND u.role_id = 2 AND e.id != ?`,
                    [targetDept, id]
                );
                if (managers.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `The department/branch "${targetDept}" already has a manager. Only one manager is allowed per department.`
                    });
                }
            }

            await db.promise().query(
                `UPDATE employees
                 SET first_name = ?, last_name = ?, email = ?, department = ?, designation = ?,
                     mobile = ?, gender = ?, salary = ?, employment_type = ?, status = ?,
                     date_of_birth = ?, probation_period = ?
                 WHERE id = ?`,
                [
                    first_name !== undefined ? first_name : employee.first_name,
                    last_name !== undefined ? last_name : employee.last_name,
                    email !== undefined ? email : employee.email,
                    department !== undefined ? department : employee.department,
                    designation !== undefined ? designation : employee.designation,
                    mobile !== undefined ? mobile : employee.mobile,
                    gender !== undefined ? gender : employee.gender,
                    salary !== undefined ? salary : employee.salary,
                    employment_type !== undefined ? employment_type : employee.employment_type,
                    status !== undefined ? status : employee.status,
                    date_of_birth !== undefined ? date_of_birth : employee.date_of_birth,
                    probation_period !== undefined ? probation_period : employee.probation_period,
                    id
                ]
            );

            const newEmail = email || employee.email;
            const newName = `${first_name || employee.first_name} ${last_name || employee.last_name}`;
            const newStatus = status || employee.status;

            if (userRole) {
                const newRoleId = userRole === "Manager" ? 2 : 3;
                await db.promise().query(
                    `UPDATE users SET name = ?, email = ?, status = ?, role_id = ? WHERE email = ?`,
                    [newName, newEmail, newStatus, newRoleId, employee.email]
                );
            } else {
                await db.promise().query(
                    `UPDATE users SET name = ?, email = ?, status = ? WHERE email = ?`,
                    [newName, newEmail, newStatus, employee.email]
                );
            }
        }

        res.status(200).json({
            success: true,
            message: "Employee Updated Successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }

};

const deleteEmployee = async (req, res) => {

    try {

        const id = req.params.id;

        await db.promise().query(
            "DELETE FROM employees WHERE id=?",
            [id]
        );

        res.status(200).json({
            success:true,
            message:
            "Employee Deleted Successfully"
        });

    }
    catch(error){

        console.log(error);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};

const revealEmployeePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPassword } = req.body;
        const adminId = req.user.id;

        if (!adminPassword) {
            return res.status(400).json({
                success: false,
                message: "Admin password is required"
            });
        }

        const [admins] = await db.promise().query("SELECT * FROM users WHERE id = ?", [adminId]);
        if (admins.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found"
            });
        }
        const admin = admins[0];

        const isMatch = await bcrypt.compare(adminPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed. Invalid admin password."
            });
        }

        const [employees] = await db.promise().query("SELECT * FROM employees WHERE id = ?", [id]);
        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        const emp = employees[0];

        const plainPassword = decryptPassword(emp.password);

        return res.json({
            success: true,
            password: plainPassword
        });

    } catch (error) {
        console.error("Reveal password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reveal employee password"
        });
    }
};

module.exports = {
    getEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    revealEmployeePassword
};