const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createStock,
    getAllStock,
    getStockById,
    getStockByItemId,
    getTotalStockByItemId,
    updateStock,
    deleteStock,
    getStockAnalytics
} = require("../controller/InventoryStockController");

// Create new stock entry (Manager and Admin only)
router.post("/", authenticateUser, createStock);

// Get all stock entries
router.get("/", authenticateUser, getAllStock);

// Get stock analytics
router.get("/analytics", authenticateUser, getStockAnalytics);

// Get total available stock for an item
router.get("/total/:itemId", authenticateUser, getTotalStockByItemId);

// Get stock entries by item ID
router.get("/item/:itemId", authenticateUser, getStockByItemId);

// Get stock entry by ID
router.get("/:stockId", authenticateUser, getStockById);

// Update stock quantity (Manager and Admin only)
router.put("/:stockId", authenticateUser, updateStock);

// Delete stock entry (Manager and Admin only)
router.delete("/:stockId", authenticateUser, deleteStock);

module.exports = router; 