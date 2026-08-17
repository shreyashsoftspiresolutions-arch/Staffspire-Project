const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    changePassword
} = require("../controllers/authController");

const {
    registerUser,
    loginUser,
    getProfile,
    registerAdmin,
    checkAdminExists
} = require("../controllers/authController");

router.post("/register", registerUser);

router.get("/check-admin-exists", checkAdminExists);

router.post("/register-admin", registerAdmin);

router.post("/login", loginUser);

router.get("/profile", protect, getProfile);

router.put(
    "/change-password",
    protect,
    changePassword
);

const {
    forgotPassword,
    resetPassword,
    verifyOTP,
    contactUs
}
=
require("../controllers/authController");

router.post(
    "/forgot-password",
    forgotPassword
);

router.put(
    "/reset-password",
    resetPassword
);

router.post(
    "/verify-otp",
    verifyOTP
);

router.post(
    "/contact",
    contactUs
);

module.exports = router;
