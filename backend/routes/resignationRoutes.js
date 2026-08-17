const express = require("express");
const router = express.Router();
const { 
    applyResignation, 
    withdrawResignation, 
    getEmployeeResignation, 
    getAllResignations, 
    updateResignationStatus,
    requestCancellation
} = require("../controllers/resignationController");
const verifyToken = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Employee routes
router.post("/", verifyToken, applyResignation);
router.get("/employee", verifyToken, getEmployeeResignation);
router.put("/:id/withdraw", verifyToken, withdrawResignation);
router.put("/:id/request-cancellation", verifyToken, requestCancellation);

// Admin routes
router.get("/", verifyToken, adminOnly, getAllResignations);
router.put("/:id", verifyToken, adminOnly, updateResignationStatus);

module.exports = router;
