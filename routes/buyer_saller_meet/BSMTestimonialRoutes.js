const express = require('express');
const router = express.Router();
const BSMTestimonialController = require('../../controllers/buyer_saller_meet/BSMTestimonialController');

// Public routes
router.get('/testimonials', BSMTestimonialController.getAll);

// Admin/Internal routes
router.post('/testimonials', BSMTestimonialController.create);
router.put('/testimonials/:id', BSMTestimonialController.update);
router.delete('/testimonials/:id', BSMTestimonialController.delete);
router.post('/seed', BSMTestimonialController.seed);

module.exports = router;
