const express = require('express');
const router = express.Router();
const testimonialsController = require('../controllers/testimonialsController');

// GET all testimonials data
router.get('/', (req, res) => testimonialsController.getTestimonials(req, res));

// POST update headings
router.post('/headings', (req, res) => testimonialsController.updateHeadings(req, res));

// POST add new card
router.post('/cards', (req, res) => testimonialsController.addCard(req, res));

// PUT update card
router.put('/cards/:id', (req, res) => testimonialsController.updateCard(req, res));

// DELETE card
router.delete('/cards/:id', (req, res) => testimonialsController.deleteCard(req, res));

module.exports = router;
