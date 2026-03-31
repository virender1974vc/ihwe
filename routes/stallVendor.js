const express = require('express');
const router = express.Router();
const stallVendorController = require('../controllers/stallVendorController');

// Get all content
router.get('/', (req, res) => stallVendorController.getContent(req, res));

// Headings
router.get('/headings', (req, res) => stallVendorController.getHeadings(req, res));
router.post('/headings', (req, res) => stallVendorController.updateHeadings(req, res));

// Cards
router.post('/cards', (req, res) => stallVendorController.addCard(req, res));
router.put('/cards/:id', (req, res) => stallVendorController.updateCard(req, res));
router.delete('/cards/:id', (req, res) => stallVendorController.deleteCard(req, res));

module.exports = router;
