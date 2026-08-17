const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly, adminOrManager } = require("../middleware/roleMiddleware");

const {
    createProject, getAllProjects, getProjectById, updateProject, deleteProject, archiveProject,
    addMember, removeMember,
    createMilestone, updateMilestone, deleteMilestone,
    getProjectAnalytics
} = require("../controllers/projectController");

// Use auth middleware on all routes
router.use(authMiddleware);

// Analytics
router.get("/analytics", getProjectAnalytics);

// Members (Must be defined before /:id routes)
router.post("/members", adminOrManager, addMember);
router.delete("/members", adminOrManager, removeMember);

// Milestones
router.post("/milestones", adminOrManager, createMilestone);
router.put("/milestones/:id", adminOrManager, updateMilestone);
router.delete("/milestones/:id", adminOrManager, deleteMilestone);

// Projects CRUD
router.post("/", adminOrManager, createProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.put("/:id", adminOrManager, updateProject);
router.delete("/:id", adminOnly, deleteProject);
router.put("/:id/archive", adminOnly, archiveProject);

module.exports = router;
