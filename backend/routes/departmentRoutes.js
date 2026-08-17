const express = require("express");
const router = express.Router();

const {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById
} = require("../controllers/departmentController");

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", addDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;