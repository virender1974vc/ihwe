const express = require('express');
const router = express.Router();
const testimonialsCarouselController = require('../../../controllers/organic_expo/home/testimonialsCarouselController');

// @route   GET /api/organic/testimonials-carousel
router.get('/', (req, res) => testimonialsCarouselController.getTestimonials(req, res));

// @route   POST /api/organic/testimonials-carousel
router.post('/', (req, res) => testimonialsCarouselController.updateTestimonials(req, res));

module.exports = router;
