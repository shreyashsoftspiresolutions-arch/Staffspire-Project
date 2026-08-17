const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { adminOnly, adminOrManager } = require("../middleware/roleMiddleware");
const { getManagerDashboardInfo } = require("../controllers/managerDashboardController");
const { getAdminDashboardStats } = require("../controllers/adminDashboardController");

router.get(
    "/dashboard",
    protect,
    adminOnly,
    (req,res)=>{
        res.json({
            success:true,
            message:"Welcome Admin Dashboard"
        });
    }
);

router.get(
    "/dashboard-stats",
    protect,
    adminOnly,
    getAdminDashboardStats
);

router.get(
    "/manager/dashboard-info",
    protect,
    adminOrManager,
    getManagerDashboardInfo
);

module.exports = router;