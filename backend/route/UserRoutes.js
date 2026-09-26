const express = require("express");
const userController = require("../controller/UserController");
const googleAuthController = require("../controller/googleAuthController");
const { authenticateUser, optionalAuthenticate, authorizeRole } = require("../middleware/AuthMiddleware");
const { rateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const authLimit = rateLimiter({ windowMs: 15 * 60 * 1000, max: 8, action: "auth" });


// Public Routes
router.post("/register", userController.createUser); // Create User
router.post("/login", authLimit, userController.login);
router.post("/logout", userController.logout); // Logout User
router.post("/forget-password", authLimit, userController.forgetPassword);
router.post("/verify-code", authLimit, userController.verifyCode);
router.post("/reset-password", authLimit, userController.resetPassword);
router.get("/auth/google", googleAuthController.startGoogleLogin);
router.get("/auth/google/callback", googleAuthController.handleGoogleCallback);

// Protected Routes
router.get("/me", authenticateUser, googleAuthController.getMe);
router.get("/users", authenticateUser, userController.getUsers); // Get All Users
router.get("/users/:id", authenticateUser, userController.getUserById); // Get User by ID
router.get("/users/role/:role", authenticateUser, userController.getUsersByRole); // Get Users by Role
router.put("/users/:id", authenticateUser, userController.updateUser); // Update User
router.delete("/users/:id", authenticateUser, userController.deleteUser); // Delete User

module.exports = router;