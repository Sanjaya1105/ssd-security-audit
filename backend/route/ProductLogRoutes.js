const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const ProductLogController = require('../controller/ProductLogController');

// Create a new production log
router.post('/', authenticateUser, ProductLogController.create);

// Get all production logs
router.get('/', authenticateUser, ProductLogController.getAll);

// Get product stock summary
router.get('/stock/summary', authenticateUser, ProductLogController.getProductStock);

// Get a single production log by ID
router.get('/:id', authenticateUser, ProductLogController.getById);

// Update a production log
router.put('/:id', authenticateUser, ProductLogController.update);

// Delete a production log
router.delete('/:id', authenticateUser, ProductLogController.delete);

module.exports = router; 