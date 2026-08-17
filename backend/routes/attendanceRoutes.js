const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { adminOnly, adminOrManager } = require("../middleware/roleMiddleware");
const {
    checkIn,
    checkOut,
    getTodayStatus,
    getEmployeeHistory,
    getAllAttendance,
    getEmployeeAttendance,
    adminCheckOut
} = require("../controllers/attendanceController");

// Employee routes (Requires general JWT authentication)
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.get("/today", protect, getTodayStatus);
router.get("/history", protect, getEmployeeHistory);

// Admin/Manager routes
router.get("/", protect, adminOrManager, getAllAttendance);
router.post("/admin/check-out", protect, adminOrManager, adminCheckOut);
router.get("/:employeeId", protect, adminOrManager, getEmployeeAttendance);

module.exports = router;
