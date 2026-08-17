const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    getEmployeeReport,
    getAttendanceReport,
    getLeaveReport,
    getTaskReport,
    getDepartmentReport,
    getDashboardStats,
    exportCSV,
    exportExcel,
    exportPDF
} = require("../controllers/reportController");

// Report Data Endpoints
router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/employees", protect, getEmployeeReport);
router.get("/attendance", protect, getAttendanceReport);
router.get("/leaves", protect, getLeaveReport);
router.get("/tasks", protect, getTaskReport);
router.get("/departments", protect, getDepartmentReport);

// Export Endpoints
router.get("/export/csv", protect, exportCSV);
router.get("/export/excel", protect, exportExcel);
router.get("/export/pdf", protect, exportPDF);

module.exports = router;
