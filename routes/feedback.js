const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Get all feedback
router.get('/', feedbackController.getAllFeedback);

// Get feedback statistics
router.get('/stats/summary', feedbackController.getFeedbackStats);

// Get feedback by project type
router.get('/project/:projectType', feedbackController.getFeedbackByProject);

// Get single feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// Create new feedback
router.post('/', feedbackController.createFeedback);

// Update feedback
router.put('/:id', feedbackController.updateFeedback);

// Delete feedback
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
