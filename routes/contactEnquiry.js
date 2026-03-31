const express = require('express');
const router = express.Router();
const contactEnquiryController = require('../controllers/contactEnquiryController');

// @route   POST /api/contact-enquiry
// @desc    Submit a contact enquiry
// @access  Public
router.post('/', (req, res) => contactEnquiryController.submitEnquiry(req, res));

// @route   GET /api/contact-enquiry
// @desc    Get all contact enquiries
// @access  Public (Should be protected in production)
router.get('/', (req, res) => contactEnquiryController.getAllEnquiries(req, res));

// @route   DELETE /api/contact-enquiry/:id
// @desc    Delete a contact enquiry
// @access  Public (Should be protected in production)
router.delete('/:id', (req, res) => contactEnquiryController.deleteEnquiry(req, res));

module.exports = router;
