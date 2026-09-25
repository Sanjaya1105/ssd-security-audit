const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createProductionLog,
    getAllProductionLogs,
    getProductionLogById,
    getProductionLogsByProduct,
    getProductionLogsByInventoryRelease,
    getProductStock
} = require("../controller/ProductionLogController");

// Create new production log (Manager and Admin only)
router.post("/", authenticateUser, createProductionLog);

// Get all production logs (Authenticated users only)
router.get("/", authenticateUser, getAllProductionLogs);

// Get production logs by product ID (Authenticated users only)
router.get("/product/:productId", authenticateUser, getProductionLogsByProduct);

// Get production logs by inventory release ID (Authenticated users only)
router.get("/inventory-release/:inventoryReleaseId", authenticateUser, getProductionLogsByInventoryRelease);

// Get production log by ID (Authenticated users only)
router.get("/:productionId", authenticateUser, getProductionLogById);

// Get current stock for a product (Authenticated users only)
router.get("/stock/:productId", authenticateUser, getProductStock);

module.exports = router;