const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const {
    handleOrderFlow,
   getAllOrders,
    getOrder,
    getUserOrders,
    // checkInventoryStatus,
    // processInventoryAfterPayment,
    // processInventory,
    getRecentProductionOrders,
    getAllOrdersForAdmin,
    getOrdersByDateRange,
    // updateOrder,
    deleteOrder,
    processOrder,
    processProductionOrder,
    updateOrderStatus
} = require('../controller/OrderController');

// Get all orders
router.get('/', authenticateUser, getAllOrders);

// Get orders by date range
router.get('/by-date', authenticateUser, getOrdersByDateRange);

// Get user's orders
router.get('/user/orders', authenticateUser, getUserOrders);

router.post('/:id/process-production-order', authenticateUser, processProductionOrder);

// Get recent production orders
router.get('/recent-production', authenticateUser, getRecentProductionOrders);

// Get all orders (admin only)
router.get('/admin/orders', authenticateUser, getAllOrdersForAdmin);

// Create a new order and check inventory (Step 1)
router.post('/', authenticateUser, handleOrderFlow);

// Routes with :id parameter should be at the bottom
// Get a specific order
router.get('/:id', authenticateUser, getOrder);

// Check inventory status for an order

// Process inventory after successful payment (Step 3)
// router.post('/:id/process-inventory', authenticateUser, processInventory);

// Process inventory after payment
// router.patch('/:id/process-inventory-after-payment', authenticateUser, processInventoryAfterPayment);

// Process order (unified endpoint)
router.post('/:id/process', authenticateUser, processOrder);

// Get recent production orders
router.get('/production/recent', authenticateUser, getRecentProductionOrders);

// New admin-only routes for updating and deleting orders
// router.put('/:id', authenticateUser, updateOrder);
router.delete('/:id', authenticateUser, deleteOrder);

// Route to update order status
router.put('/:orderId', authenticateUser, updateOrderStatus);

module.exports = router; 