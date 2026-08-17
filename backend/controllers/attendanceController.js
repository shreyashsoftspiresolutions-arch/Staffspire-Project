const db = require("../config/db");

// Helper: Haversine distance formula in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in meters
};

// Helper: Get employee_id for the logged-in user
const getEmployeeIdFromUser = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return null;
    
    const [employees] = await db.promise().query("SELECT employee_id FROM employees WHERE email = ?", [users[0].email]);
    if (employees.length === 0) return null;
    
    return employees[0].employee_id;
};

// Helper: Retrieve office geofence settings (fallback to default head office if not set)
const getGeofenceSettings = async () => {
    const [rows] = await db.promise().query("SELECT * FROM office_settings LIMIT 1");
    if (rows.length > 0) {
        return rows[0];
    }
    return {
        office_name: "Head Office",
        latitude: 18.52040000,
        longitude: 73.85670000,
        attendance_radius: 100.0
    };
};

// Helper: Automatically check out expired records
const autoCheckOutExpiredRecords = async () => {
    try {
        const localDate = new Date().toLocaleDateString('sv');
        const currentTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS
        
        // Find all records that are checked in but have no check-out, and are either:
        // 1. For a past date
        // 2. For today, but current time is past 10:30 PM (22:30:00)
        const [records] = await db.promise().query(
            `SELECT * FROM attendance 
             WHERE check_out IS NULL 
               AND check_in IS NOT NULL
               AND (attendance_date < ? OR (attendance_date = ? AND ? >= '22:30:00'))`,
            [localDate, localDate, currentTime]
        );
        
        for (const record of records) {
            const autoOutTime = "22:30:00";
            const limitTime = "18:00:00"; // Working hours cap at 6:00 PM
            
            const [inH, inM, inS] = record.check_in.split(":").map(Number);
            const [limitH, limitM, limitS] = limitTime.split(":").map(Number);
            
            let inSeconds = inH * 3600 + inM * 60 + inS;
            let limitSeconds = limitH * 3600 + limitM * 60 + limitS;
            
            let diffSeconds = limitSeconds - inSeconds;
            if (diffSeconds < 0) diffSeconds = 0;
            
            const diffH = Math.floor(diffSeconds / 3600);
            const diffM = Math.floor((diffSeconds % 3600) / 60);
            const diffS = diffSeconds % 60;
            
            const workingHours = [
                String(diffH).padStart(2, '0'),
                String(diffM).padStart(2, '0'),
                String(diffS).padStart(2, '0')
            ].join(":");
            
            let status = record.status;
            if (diffSeconds < 4 * 3600) {
                status = "Half Day";
            }
            
            await db.promise().query(
                `UPDATE attendance SET check_out = ?, working_hours = ?, status = ? WHERE id = ?`,
                [autoOutTime, workingHours, status, record.id]
            );
        }
    } catch (err) {
        console.error("Error in autoCheckOutExpiredRecords helper:", err);
    }
};

// Helper: Automatically mark all active employees as absent at 8:45 AM or later
const autoMarkAbsents = async () => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        // Saturday & Sunday are holidays, do not mark absent
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        const checkInTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
        // The check-in starts at 8:45. So we only auto-mark absent if current time is past 08:45:00.
        if (checkInTime < "08:45:00") return;

        const localDate = now.toLocaleDateString('sv'); // YYYY-MM-DD

        // Select all active employees
        const [employees] = await db.promise().query(
            "SELECT employee_id FROM employees WHERE status = 'Active'"
        );

        for (const employee of employees) {
            // Check if they already have an attendance record for today (of any status)
            const [existing] = await db.promise().query(
                "SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?",
                [employee.employee_id, localDate]
            );

            if (existing.length === 0) {
                // Check if they are on approved or pending cancellation leave today.
                // If they are on approved leave, we don't mark them as absent.
                const [leaveRecords] = await db.promise().query(
                    `SELECT id FROM leave_requests 
                     WHERE employee_id = ? 
                       AND status IN ('Approved', 'Pending Cancellation') 
                       AND ? BETWEEN start_date AND end_date`,
                    [employee.employee_id, localDate]
                );

                if (leaveRecords.length === 0) {
                    await db.promise().query(
                        `INSERT INTO attendance (employee_id, attendance_date, status)
                         VALUES (?, ?, 'Absent')`,
                        [employee.employee_id, localDate]
                    );
                }
            }
        }
    } catch (err) {
        console.error("Error in autoMarkAbsents helper:", err);
    }
};

// 1. POST /api/attendance/check-in
const checkIn = async (req, res) => {
    try {
        await autoCheckOutExpiredRecords();
        await autoMarkAbsents();
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found or user is not an employee."
            });
        }

        // ── LIVE LOCATION TEMPORARILY DISABLED ──────────────────────────────
        // const { latitude, longitude, accuracy } = req.body;
        // if (latitude === undefined || longitude === undefined) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Location permissions and coordinates are required to mark attendance."
        //     });
        // }
        // ────────────────────────────────────────────────────────────────────

        const localDate = new Date().toLocaleDateString('sv');
        const checkInTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

        // Enforce Holiday: Saturday & Sunday are blocked
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({
                success: false,
                message: "Check-in is not allowed on Saturdays and Sundays (Holidays)."
            });
        }

        // Enforce Check-in time window: 8:45 AM to 2:00 PM
        if (checkInTime < "08:45:00" || checkInTime > "14:00:00") {
            return res.status(400).json({
                success: false,
                message: "Check-in is only allowed between 8:45 AM and 2:00 PM."
            });
        }

        // Enforce Leave check: Check if employee has an Approved or Pending Cancellation leave request today
        const [leaveRecords] = await db.promise().query(
            `SELECT id FROM leave_requests 
             WHERE employee_id = ? 
               AND status IN ('Approved', 'Pending Cancellation') 
               AND ? BETWEEN start_date AND end_date`,
            [employeeId, localDate]
        );
        if (leaveRecords.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Check-in is blocked because you are on approved leave today."
            });
        }

        // Check if already checked in today
        const [existing] = await db.promise().query(
            "SELECT id, status FROM attendance WHERE employee_id = ? AND attendance_date = ?",
            [employeeId, localDate]
        );

        if (existing.length > 0) {
            if (existing[0].status !== 'Absent') {
                return res.status(400).json({
                    success: false,
                    message: "Attendance already marked for today."
                });
            }
        }

        // ── GEOFENCE CALCULATION TEMPORARILY DISABLED ───────────────────────
        // const office = await getGeofenceSettings();
        // const distance = calculateDistance(
        //     parseFloat(latitude), parseFloat(longitude),
        //     parseFloat(office.latitude), parseFloat(office.longitude)
        // );
        // const locationStatus = distance <= office.attendance_radius ? "Inside Office" : "Outside Office";
        // const locationCapturedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        // ────────────────────────────────────────────────────────────────────

        // Determine status (Present or Late, threshold 09:15:00)
        let status = "Present";
        if (checkInTime > "09:15:00") {
            status = "Late";
        }

        if (existing.length > 0 && existing[0].status === 'Absent') {
            await db.promise().query(
                `UPDATE attendance SET check_in = ?, status = ? WHERE id = ?`,
                [checkInTime, status, existing[0].id]
            );
        } else {
            await db.promise().query(
                `INSERT INTO attendance (employee_id, attendance_date, check_in, status)
                 VALUES (?, ?, ?, ?)`,
                [employeeId, localDate, checkInTime, status]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Checked in successfully.",
            data: {
                attendance_date: localDate,
                check_in: checkInTime,
                status
            }
        });
    } catch (error) {
        console.error("Check-in error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during check-in."
        });
    }
};

// 2. POST /api/attendance/check-out
const checkOut = async (req, res) => {
    try {
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found."
            });
        }

        // ── LIVE LOCATION TEMPORARILY DISABLED ──────────────────────────────
        // const { latitude, longitude, accuracy } = req.body;
        // if (latitude === undefined || longitude === undefined) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Location permissions and coordinates are required to mark attendance."
        //     });
        // }
        // ────────────────────────────────────────────────────────────────────

        const localDate = new Date().toLocaleDateString('sv');
        const checkOutTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

        // Enforce check-out window: 8:45 AM to 10:30 PM
        if (checkOutTime < "08:45:00" || checkOutTime > "22:30:00") {
            return res.status(400).json({
                success: false,
                message: "Check-out is only allowed between 8:45 AM and 10:30 PM."
            });
        }

        // Get today's attendance record
        const [rows] = await db.promise().query(
            "SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?",
            [employeeId, localDate]
        );

        if (rows.length === 0 || !rows[0].check_in) {
            return res.status(400).json({
                success: false,
                message: "Please check in first."
            });
        }

        const record = rows[0];
        if (record.check_out) {
            return res.status(400).json({
                success: false,
                message: "Already checked out for today."
            });
        }

        // ── GEOFENCE CALCULATION TEMPORARILY DISABLED ───────────────────────
        // const office = await getGeofenceSettings();
        // const distance = calculateDistance(
        //     parseFloat(latitude), parseFloat(longitude),
        //     parseFloat(office.latitude), parseFloat(office.longitude)
        // );
        // const locationStatus = distance <= office.attendance_radius ? "Inside Office" : "Outside Office";
        // const locationCapturedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        // ────────────────────────────────────────────────────────────────────

        // Calculate working hours
        const [inH, inM, inS] = record.check_in.split(":").map(Number);
        const [outH, outM, outS] = checkOutTime.split(":").map(Number);

        let inSeconds = inH * 3600 + inM * 60 + inS;
        let outSeconds = outH * 3600 + outM * 60 + outS;
        let diffSeconds = outSeconds - inSeconds;
        if (diffSeconds < 0) diffSeconds = 0;

        const diffH = Math.floor(diffSeconds / 3600);
        const diffM = Math.floor((diffSeconds % 3600) / 60);
        const diffS = diffSeconds % 60;

        const workingHours = [
            String(diffH).padStart(2, '0'),
            String(diffM).padStart(2, '0'),
            String(diffS).padStart(2, '0')
        ].join(":");

        // Determine final status (Half Day if less than 4 hours, else keep Present/Late)
        let status = record.status;
        if (diffSeconds < 4 * 3600) {
            status = "Half Day";
        }

        await db.promise().query(
            `UPDATE attendance SET check_out = ?, working_hours = ?, status = ? WHERE id = ?`,
            [checkOutTime, workingHours, status, record.id]
        );

        return res.status(200).json({
            success: true,
            message: "Checked out successfully.",
            // locationStatus,
            distance,
            data: {
                check_out: checkOutTime,
                working_hours: workingHours,
                status
            }
        });
    } catch (error) {
        console.error("Check-out error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during check-out."
        });
    }
};

// 3. GET /api/attendance/today
const getTodayStatus = async (req, res) => {
    try {
        await autoCheckOutExpiredRecords();
        await autoMarkAbsents();
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found."
            });
        }

        const localDate = new Date().toLocaleDateString('sv');
        const [rows] = await db.promise().query(
            "SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?",
            [employeeId, localDate]
        );
        const attendanceRecord = rows[0] || null;

        // Determine if check-in is allowed
        let isCheckInAllowed = true;
        let checkInBlockReason = "";

        const checkInTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday

        if (attendanceRecord && attendanceRecord.status !== 'Absent') {
            isCheckInAllowed = false;
            checkInBlockReason = "You have already checked in today.";
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            isCheckInAllowed = false;
            checkInBlockReason = "Check-in is disabled on weekends (Saturday & Sunday).";
        } else if (checkInTime < "08:45:00" || checkInTime > "14:00:00") {
            isCheckInAllowed = false;
            checkInBlockReason = "Check-in is only open from 8:45 AM to 2:00 PM.";
        } else {
            // Check approved leaves
            const [leaveRecords] = await db.promise().query(
                `SELECT id FROM leave_requests 
                 WHERE employee_id = ? 
                   AND status IN ('Approved', 'Pending Cancellation') 
                   AND ? BETWEEN start_date AND end_date`,
                [employeeId, localDate]
            );
            if (leaveRecords.length > 0) {
                isCheckInAllowed = false;
                checkInBlockReason = "Check-in is blocked because you are on approved leave today.";
            }
        }

        // Determine if check-out is allowed
        let isCheckOutAllowed = false;
        let checkOutBlockReason = "";

        const checkOutTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

        if (!attendanceRecord || !attendanceRecord.check_in) {
            isCheckOutAllowed = false;
            checkOutBlockReason = "Please check in first.";
        } else if (attendanceRecord.check_out) {
            isCheckOutAllowed = false;
            checkOutBlockReason = "You have already checked out today.";
        } else if (checkOutTime < "08:45:00" || checkOutTime > "22:30:00") {
            isCheckOutAllowed = false;
            checkOutBlockReason = "Check-out is only allowed between 8:45 AM and 10:30 PM.";
        } else {
            isCheckOutAllowed = true;
        }

        let todayStatusLabel = "Absent";
        if (attendanceRecord) {
            todayStatusLabel = attendanceRecord.status;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            todayStatusLabel = "Weekly Off";
        } else {
            const [leaveRecords] = await db.promise().query(
                `SELECT id FROM leave_requests 
                 WHERE employee_id = ? 
                   AND status IN ('Approved', 'Pending Cancellation') 
                   AND ? BETWEEN start_date AND end_date`,
                [employeeId, localDate]
            );
            if (leaveRecords.length > 0) {
                todayStatusLabel = "On Leave";
            }
        }

        return res.status(200).json({
            success: true,
            attendance: attendanceRecord,
            isCheckInAllowed,
            checkInBlockReason,
            isCheckOutAllowed,
            checkOutBlockReason,
            todayStatusLabel
        });
    } catch (error) {
        console.error("Get today status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load today's status."
        });
    }
};

// 4. GET /api/attendance/history (for current employee)
const getEmployeeHistory = async (req, res) => {
    try {
        await autoCheckOutExpiredRecords();
        await autoMarkAbsents();
        const employeeId = await getEmployeeIdFromUser(req.user.id);
        if (!employeeId) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found."
            });
        }

        const [rows] = await db.promise().query(
            "SELECT * FROM attendance WHERE employee_id = ? ORDER BY attendance_date DESC",
            [employeeId]
        );

        return res.status(200).json({
            success: true,
            history: rows
        });
    } catch (error) {
        console.error("Get history error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load attendance history."
        });
    }
};

const getManagerDepartment = async (userId) => {
    const [users] = await db.promise().query("SELECT email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return null;
    const [employees] = await db.promise().query("SELECT department FROM employees WHERE email = ?", [users[0].email]);
    return employees.length ? employees[0].department : null;
};

// 5. GET /api/attendance (Admin view: gets all attendance records)
const getAllAttendance = async (req, res) => {
    try {
        await autoCheckOutExpiredRecords();
        await autoMarkAbsents();
        const role = req.user.role;
        let query = `
            SELECT a.*, e.first_name, e.last_name, e.email, e.department, e.designation 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
        `;
        const params = [];
        if (role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (dept) {
                query += " WHERE e.department = ?";
                params.push(dept);
            } else {
                return res.status(200).json({ success: true, attendance: [] });
            }
        }
        query += " ORDER BY a.attendance_date DESC, a.check_in DESC";

        const [rows] = await db.promise().query(query, params);

        return res.status(200).json({
            success: true,
            attendance: rows
        });
    } catch (error) {
        console.error("Get all attendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load attendance details."
        });
    }
};

// 6. GET /api/attendance/:employeeId (Admin view: history for specific employee)
const getEmployeeAttendance = async (req, res) => {
    try {
        await autoCheckOutExpiredRecords();
        await autoMarkAbsents();
        const { employeeId } = req.params;
        const role = req.user.role;

        const [rows] = await db.promise().query(
            `SELECT a.*, e.first_name, e.last_name, e.department, e.designation 
             FROM attendance a
             JOIN employees e ON a.employee_id = e.employee_id
             WHERE a.employee_id = ?
             ORDER BY a.attendance_date DESC`,
            [employeeId]
        );

        if (rows.length > 0 && role === "Manager") {
            const dept = await getManagerDepartment(req.user.id);
            if (rows[0].department !== dept) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Employee is not in your department."
                });
            }
        }

        return res.status(200).json({
            success: true,
            history: rows
        });
    } catch (error) {
        console.error("Get employee attendance error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load specific employee attendance history."
        });
    }
};

// 7. POST /api/attendance/admin/check-out
const adminCheckOut = async (req, res) => {
    try {
        const { employeeId, attendanceDate } = req.body;
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required."
            });
        }

        const targetDate = attendanceDate || new Date().toLocaleDateString('sv');

        // Get the attendance record
        const [rows] = await db.promise().query(
            "SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?",
            [employeeId, targetDate]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No check-in record found for employee on ${targetDate}.`
            });
        }

        const record = rows[0];
        if (record.check_out) {
            return res.status(400).json({
                success: false,
                message: "Employee is already checked out."
            });
        }

        const localDate = new Date().toLocaleDateString('sv');
        let checkOutTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS
        if (targetDate < localDate) {
            checkOutTime = "22:30:00";
        }

        // Calculate working hours
        const [inH, inM, inS] = record.check_in.split(":").map(Number);
        const [outH, outM, outS] = checkOutTime.split(":").map(Number);

        let inSeconds = inH * 3600 + inM * 60 + inS;
        let outSeconds = outH * 3600 + outM * 60 + outS;
        let diffSeconds = outSeconds - inSeconds;
        if (diffSeconds < 0) diffSeconds = 0;

        const diffH = Math.floor(diffSeconds / 3600);
        const diffM = Math.floor((diffSeconds % 3600) / 60);
        const diffS = diffSeconds % 60;

        const workingHours = [
            String(diffH).padStart(2, '0'),
            String(diffM).padStart(2, '0'),
            String(diffS).padStart(2, '0')
        ].join(":");

        let status = record.status;
        if (diffSeconds < 4 * 3600) {
            status = "Half Day";
        }

        await db.promise().query(
            `UPDATE attendance SET check_out = ?, working_hours = ?, status = ? WHERE id = ?`,
            [checkOutTime, workingHours, status, record.id]
        );

        return res.status(200).json({
            success: true,
            message: "Employee checked out successfully by Admin.",
            data: {
                check_out: checkOutTime,
                working_hours: workingHours,
                status
            }
        });
    } catch (error) {
        console.error("Admin check-out error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during admin check-out."
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayStatus,
    getEmployeeHistory,
    getAllAttendance,
    getEmployeeAttendance,
    adminCheckOut,
    autoMarkAbsents
};
