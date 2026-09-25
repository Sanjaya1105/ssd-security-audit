const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createInventoryRelease,
    getAllInventoryReleases,
    getInventoryReleaseById,
    getInventoryReleasesByOrder,
    updateInventoryRelease,
    deleteInventoryRelease
} = require("../controller/InventoryReleaseController");

// Create new inventory release (Manager and Admin only)
router.post("/", authenticateUser, createInventoryRelease);

// Get all inventory releases
router.get("/", getAllInventoryReleases);

// Get inventory releases by order ID
router.get("/order/:orderId", getInventoryReleasesByOrder);

// Get inventory release by ID
router.get("/:releaseId", getInventoryReleaseById);

// Update inventory release (Manager and Admin only)
router.put("/:releaseId", authenticateUser, updateInventoryRelease);

// Delete inventory release (Manager and Admin only)
router.delete("/:releaseId", authenticateUser, deleteInventoryRelease);

module.exports = router; 