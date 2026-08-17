require("dotenv").config();
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const employeeDashboardRoutes = require("./routes/employeeDashboardRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

require("./config/db");

const authRoutes = require("./routes/authRoutes");
app.use(
    "/api/admin",
    adminRoutes
);

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use(
    "/api/employees",
    employeeRoutes
);

app.use(
    "/api/employee",
    employeeDashboardRoutes
);

app.get("/", (req, res) => {
    res.send("Staffspire Backend Running");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const departmentRoutes =
    require("./routes/departmentRoutes");

app.use(
    "/api/departments",
    departmentRoutes
);

const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

const officeSettingsRoutes = require("./routes/officeSettingsRoutes");
app.use("/api/office-settings", officeSettingsRoutes);

const leaveRoutes = require("./routes/leaveRoutes");
app.use("/api/leaves", leaveRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const resignationRoutes = require("./routes/resignationRoutes");
app.use("/api/resignations", resignationRoutes);

const cron = require("node-cron");
const { autoMarkAbsents } = require("./controllers/attendanceController");

// Schedule auto-marking of absents at 8:45 AM daily
cron.schedule("45 8 * * *", () => {
    console.log("Running scheduled autoMarkAbsents task...");
    autoMarkAbsents();
});

// Process approved resignations past their last working day at midnight daily
cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled resignation completion task...");
    try {
        const db = require("./config/db");
        const { createNotification } = require("./controllers/notificationController");
        
        const [requests] = await db.promise().query(
            "SELECT id, employee_id FROM resignation_requests WHERE status = 'Approved' AND last_working_day <= CURRENT_DATE"
        );
        
        for (const req of requests) {
            await db.promise().query("UPDATE resignation_requests SET status = 'Completed' WHERE id = ?", [req.id]);
            await db.promise().query("UPDATE employees SET status = 'Resigned' WHERE employee_id = ?", [req.employee_id]);
            
            const [users] = await db.promise().query(
                "SELECT u.id FROM users u JOIN employees e ON u.login_id = e.employee_id OR u.email = e.email WHERE e.employee_id = ?",
                [req.employee_id]
            );
            if (users.length > 0) {
                await createNotification(users[0].id, "Resignation Completed", "Your last working day has passed. Your account is now marked as Resigned.");
            }
        }
    } catch (err) {
        console.error("Error in resignation cron job:", err);
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});