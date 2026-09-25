const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    getFeedbackByUserId,
    updateFeedback,
    deleteFeedback,
    getFiveStarFeedback,
    getLatestFeedback
} = require('../controller/FeedbackController');

// Create new feedback (requires authentication)
router.post('/', authenticateUser, createFeedback);

// Get all feedback (public access)
router.get('/', getAllFeedback);

// Get all 5-star feedback (public access)
router.get('/five-star', getFiveStarFeedback);

// Get latest 5 feedback entries (public access)
router.get('/latest', getLatestFeedback);

// Get feedback by ID (public access)
router.get('/:id', getFeedbackById);

// Get feedback by user ID (requires authentication)
router.get('/user/:userId', authenticateUser, getFeedbackByUserId);

// Update feedback (requires authentication and ownership)
router.put('/:id', authenticateUser, updateFeedback);

// Delete feedback (requires authentication and ownership)
router.delete('/:id', authenticateUser, deleteFeedback);

module.exports = router; 