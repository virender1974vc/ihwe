const express = require('express');
const router = express.Router();
const socialMediaController = require('../controllers/socialMediaController');

// Get social media links
router.get('/', (req, res) => socialMediaController.getSocialMedia(req, res));

// Update social media links
router.put('/', (req, res) => socialMediaController.updateSocialMedia(req, res));

module.exports = router;
