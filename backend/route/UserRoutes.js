const express = require("express");
const userController = require("../controller/UserController");
const googleAuthController = require("../controller/googleAuthController");
const { authenticateUser, optionalAuthenticate, authorizeRole } = require("../middleware/AuthMiddleware");
const { rateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const managers = [authenticateUser, authorizeRole(["admin", "manager"])];
const admins = [authenticateUser, authorizeRole(["admin"])];
const authLimit = rateLimiter({ windowMs: 15 * 60 * 1000, max: 8, action: "auth" });

// Public Routes
router.post("/register", optionalAuthenticate, userController.createUser);
router.post("/login", authLimit, userController.login);
router.post("/logout", userController.logout);
router.post("/forget-password", authLimit, userController.forgetPassword);
router.post("/verify-code", authLimit, userController.verifyCode);
router.post("/reset-password", authLimit, userController.resetPassword);

// Google OpenID Connect (authorization code grant)
router.get("/auth/google", googleAuthController.startGoogleLogin);
router.get("/auth/google/callback", googleAuthController.handleGoogleCallback);
router.get("/me", authenticateUser, googleAuthController.getMe);

// Protected Routes — /users/role/:role must stay above /users/:id
router.get("/users", ...managers, userController.getUsers);
router.get("/users/role/:role", ...managers, userController.getUsersByRole);
router.get("/users/:id", authenticateUser, userController.getUserById);
router.put("/users/:id", authenticateUser, userController.updateUser);
router.delete("/users/:id", ...admins, userController.deleteUser);

module.exports = router;
