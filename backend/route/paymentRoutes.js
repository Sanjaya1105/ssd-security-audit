const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const {
    createPaymentIntent,
    // handleWebhook,
    getAllPayments,
    getPaymentStatistics,
    confirmPayment,
    getPaymentDetails,
    getPaymentsByDateRange
} = require('../controller/paymentController');

// Create payment intent (protected route)
router.post('/create-payment-intent', authenticateUser, createPaymentIntent);

// Manual payment confirmation
router.post('/:paymentIntentId/confirm', authenticateUser, confirmPayment);

// // Webhook handler (public route)
// router.post('/webhook', handleWebhook);

// Admin routes
router.get('/all', authenticateUser, getAllPayments);
router.get('/statistics', authenticateUser, getPaymentStatistics);
router.get('/details/:id', authenticateUser, getPaymentDetails);

// Get payments by date range
router.get('/date-range', authenticateUser, getPaymentsByDateRange);

module.exports = router; 