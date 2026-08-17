const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getEmployeeDashboard } = require("../controllers/employeeDashboardController");

router.get("/dashboard", protect, getEmployeeDashboard);

module.exports = router;
