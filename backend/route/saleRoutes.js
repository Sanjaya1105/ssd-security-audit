const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createSale,
    getAllSales,
    getSaleById,
    getDailySalesReport,
    getSalesStatistics,
    getDetailedSales,
    getSaleDetails,
    getSalesByDateRange,
    getAllSalesForAdmin
} = require("../controller/saleController");

// Create a new sale (requires authentication)
router.post("/", authenticateUser, createSale);

// Get all sales (admin only)
router.get("/", authenticateUser, getAllSales);

// Get all sales with details (admin only)
router.get("/admin/sales", authenticateUser, getAllSalesForAdmin);

// Get detailed sales list
router.get("/detailed", authenticateUser, getDetailedSales);

// Get sales by date range
router.get("/date-range", authenticateUser, getSalesByDateRange);

// Get daily sales report
router.get("/report/daily", authenticateUser, getDailySalesReport);

// Get sales statistics
router.get("/statistics", authenticateUser, getSalesStatistics);

// Get detailed sale information
router.get("/details/:id", authenticateUser, getSaleDetails);

// Get sale by ID (catch-all route should be last)
router.get("/:id", authenticateUser, getSaleById);

module.exports = router; 