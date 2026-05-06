const express = require('express');
const router = express.Router();
const sponsorshipEnquiryController = require('../controllers/sponsorshipEnquiryController');
const { verifyToken } = require('../utils/verifyToken');

// Public route to submit enquiry
router.post('/', sponsorshipEnquiryController.submitEnquiry);

// Protected routes for admin
router.get('/', verifyToken, sponsorshipEnquiryController.getAllEnquiries);
router.delete('/:id', verifyToken, sponsorshipEnquiryController.deleteEnquiry);
router.patch('/:id/status', verifyToken, sponsorshipEnquiryController.updateStatus);


module.exports = router;
