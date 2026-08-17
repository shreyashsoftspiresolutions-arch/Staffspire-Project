const express = require("express");

const router = express.Router();

const protect =
require("../middleware/authMiddleware");

const {
    adminOnly,
    adminOrManager
} = require("../middleware/roleMiddleware");

const {
    getEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    revealEmployeePassword
}
=
require("../controllers/employeeController");

router.get(
    "/",
    protect,
    adminOrManager,
    getEmployees
);

router.post(
    "/",
    protect,
    adminOnly,
    createEmployee
);

router.get(
    "/:id",
    protect,
    adminOrManager,
    getEmployeeById
);

router.put(
    "/:id",
    protect,
    adminOrManager,
    updateEmployee
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteEmployee
);

router.post(
    "/:id/reveal-password",
    protect,
    adminOnly,
    revealEmployeePassword
);

module.exports = router;