const express = require('express');
const router = express.Router();
const { renderSocialPreview } = require('../controllers/socialPreviewController');

router.get('/*splat', renderSocialPreview);

module.exports = router;
