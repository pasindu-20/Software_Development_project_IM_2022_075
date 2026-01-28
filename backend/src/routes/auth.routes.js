// backend/src/routes/auth.routes.js
const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");

// Public auth
router.post("/register", authController.register);
router.post("/login", authController.login);

// Forgot password (OTP + link)
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// JWT required
router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
