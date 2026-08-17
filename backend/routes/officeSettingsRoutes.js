const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { getOfficeSettings, updateOfficeSettings } = require("../controllers/officeSettingsController");

// Retrieve settings (authenticated employees & admins)
router.get("/", protect, getOfficeSettings);

// Update settings (Admin only)
router.post("/", protect, adminOnly, updateOfficeSettings);

module.exports = router;
