const express = require('express');
const router = express.Router();
const expoSupportEnquiryController = require('../controllers/expoSupportEnquiryController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Public route for submission
router.post('/', expoSupportEnquiryController.submitEnquiry);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, expoSupportEnquiryController.getAllEnquiries);
router.delete('/:id', authMiddleware, adminMiddleware, expoSupportEnquiryController.deleteEnquiry);
router.put('/:id/status', authMiddleware, adminMiddleware, expoSupportEnquiryController.updateStatus);

module.exports = router;
