const express = require('express');
const router = express.Router();
const ePromotionController = require('../controllers/ePromotionController');

// --- Content Routes ---
router.get('/content', (req, res) => ePromotionController.getContent(req, res));
router.post('/content', (req, res) => ePromotionController.updateContent(req, res));

// --- Enquiry Routes ---
router.post('/enquiry', (req, res) => ePromotionController.submitEnquiry(req, res));
router.get('/enquiries', (req, res) => ePromotionController.getAllEnquiries(req, res));
router.delete('/enquiries/:id', (req, res) => ePromotionController.deleteEnquiry(req, res));

module.exports = router;
