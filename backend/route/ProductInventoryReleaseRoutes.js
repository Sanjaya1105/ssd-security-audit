const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const ProductInventoryRelease = require('../controller/ProductInventoryRelease');

// Create a new production inventory release
router.post('/', authenticateUser, ProductInventoryRelease.create);

// Get all production inventory releases
router.get('/', authenticateUser, ProductInventoryRelease.getAll);

// Get a single production inventory release by ID
router.get('/:id', authenticateUser, ProductInventoryRelease.getById);

// Delete a production inventory release and restore inventory
router.delete('/:id', authenticateUser, ProductInventoryRelease.delete);

module.exports = router; 