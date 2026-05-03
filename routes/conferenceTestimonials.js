const express = require('express');
const router = express.Router();
const conferenceTestimonialsController = require('../controllers/conferenceTestimonialsController');

// GET all conference testimonials data
router.get('/', (req, res) => conferenceTestimonialsController.getTestimonials(req, res));

// POST update headings
router.post('/headings', (req, res) => conferenceTestimonialsController.updateHeadings(req, res));

// POST add new card
router.post('/cards', (req, res) => conferenceTestimonialsController.addCard(req, res));

// PUT update card
router.put('/cards/:id', (req, res) => conferenceTestimonialsController.updateCard(req, res));

// DELETE card
router.delete('/cards/:id', (req, res) => conferenceTestimonialsController.deleteCard(req, res));

module.exports = router;
