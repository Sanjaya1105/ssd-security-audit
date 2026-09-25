const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    getPurchasesByItemId,
    updatePurchase,
    deletePurchase,
    getPurchaseSummaryReport,
    getWasteAnalysisReport,
    createPurchaseWithStock,
    getPurchasesByDateRange
} = require("../controller/PurchaseController");

// Create new purchase (Manager and Admin only)
router.post("/", authenticateUser, createPurchase);

// Create new purchase with automatic stock entry (Manager and Admin only)
router.post("/with-stock", authenticateUser, createPurchaseWithStock);

// Get all purchases (Manager and Admin only)
router.get("/", authenticateUser, getAllPurchases);

// Get purchase summary report (Manager and Admin only)
router.get("/report/summary", authenticateUser, getPurchaseSummaryReport);

// Get waste analysis report (Manager and Admin only)
router.get("/report/waste", authenticateUser, getWasteAnalysisReport);

// Get purchases by item ID (Manager and Admin only)
router.get("/item/:itemId", authenticateUser, getPurchasesByItemId);

// Get purchase by ID (Manager and Admin only)
router.get("/:purchaseId", authenticateUser, getPurchaseById);

// Update purchase (Manager and Admin only)
router.put("/:purchaseId", authenticateUser, updatePurchase);

// Delete purchase (Manager and Admin only)
router.delete("/:purchaseId", authenticateUser, deletePurchase);

// Get purchases by date range
router.get('/date-range', authenticateUser, getPurchasesByDateRange);

module.exports = router; 