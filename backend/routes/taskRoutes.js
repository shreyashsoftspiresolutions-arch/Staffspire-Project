const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
const protect = require("../middleware/authMiddleware");
const { adminOnly, adminOrManager } = require("../middleware/roleMiddleware");
const {
    createTask, getAllTasks, getMyTasks, getTaskStats,
    getEmployeesForAssignment, getTaskById, updateTask, deleteTask,
    submitTaskEvidence, reviewTaskSubmission, removeCommitFromSubmission, deleteTaskSubmission
} = require("../controllers/taskController");

// Stats (Admin / Manager / Employee — each sees their own scope)
router.get("/stats", protect, getTaskStats);

// Employees list for the assignment dropdown (Admin / Manager)
router.get("/employees", protect, getEmployeesForAssignment);

// Employee: my tasks
router.get("/my", protect, getMyTasks);

// Admin / Manager: all tasks (with filters)
router.get("/", protect, getAllTasks);

// Admin / Manager: create task
router.post("/", protect, createTask);

// Single task detail (any authenticated user)
router.get("/:id", protect, getTaskById);

// Update task (Admin/Manager: full; Employee: status+remarks+evidence)
router.put("/:id", protect, upload.array("attachments", 5), updateTask);

// Delete task (Admin/Manager)
router.delete("/:id", protect, adminOrManager, deleteTask);

// Submit task evidence (Employee)
router.post("/:id/submissions", protect, upload.array("attachments", 5), submitTaskEvidence);

// Review task submission (Admin/Manager)
router.post("/:id/submissions/:submissionId/review", protect, reviewTaskSubmission);

// Remove specific commit from submission
router.delete("/:id/submissions/:submissionId/commits/:commitHash", protect, removeCommitFromSubmission);

// Delete entire submission
router.delete("/:id/submissions/:submissionId", protect, deleteTaskSubmission);

module.exports = router;
