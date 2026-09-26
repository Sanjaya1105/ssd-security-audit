const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/AuthMiddleware");
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

const managers = [authenticateUser, authorizeRole(["admin", "manager"])];
const staff = [authenticateUser, authorizeRole(["admin", "manager", "cashier"])];

router.post("/", ...managers, createStock);
router.get("/", ...staff, getAllStock);
router.get("/analytics", ...staff, getStockAnalytics);
router.get("/total/:itemId", ...staff, getTotalStockByItemId);
router.get("/item/:itemId", ...staff, getStockByItemId);
router.get("/:stockId", ...staff, getStockById);
router.put("/:stockId", ...managers, updateStock);
router.delete("/:stockId", ...managers, deleteStock);

module.exports = router;
