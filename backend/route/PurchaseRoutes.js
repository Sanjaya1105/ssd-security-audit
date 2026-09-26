const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
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

const managers = [authenticateUser, authorizeRole(["admin", "manager"])];

router.post("/", ...managers, createPurchase);
router.post("/with-stock", ...managers, createPurchaseWithStock);
router.get("/", ...managers, getAllPurchases);
router.get("/report/summary", ...managers, getPurchaseSummaryReport);
router.get("/report/waste", ...managers, getWasteAnalysisReport);
router.get("/date-range", ...managers, getPurchasesByDateRange);
router.get("/item/:itemId", ...managers, getPurchasesByItemId);
router.get("/:purchaseId", ...managers, getPurchaseById);
router.put("/:purchaseId", ...managers, updatePurchase);
router.delete("/:purchaseId", ...managers, deletePurchase);

module.exports = router;
