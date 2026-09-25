const express = require("express");
const userController = require("../controller/UserController");
const { authenticateUser } = require('../middleware/AuthMiddleware');

const router = express.Router();

// Public Routes
router.post("/register", userController.createUser); // Create User
router.post("/login", userController.login); // Login User
router.post("/logout", userController.logout); // Logout User
router.post("/forget-password", userController.forgetPassword); // Forget Password
router.post("/verify-code", userController.verifyCode); // Verify Code
router.post("/reset-password", userController.resetPassword); // Reset Password

// Protected Routes
router.get("/users", authenticateUser, userController.getUsers); // Get All Users
router.get("/users/:id", authenticateUser, userController.getUserById); // Get User by ID
router.get("/users/role/:role", authenticateUser, userController.getUsersByRole); // Get Users by Role
router.put("/users/:id", authenticateUser, userController.updateUser); // Update User
router.delete("/users/:id", authenticateUser, userController.deleteUser); // Delete User

module.exports = router;