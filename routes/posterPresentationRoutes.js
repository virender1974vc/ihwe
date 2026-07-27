const express = require('express');
const router = express.Router();
const { getPosterPresentationData, updatePosterPresentationData } = require('../controllers/posterPresentationController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(getPosterPresentationData)
    .put(authMiddleware, adminMiddleware, updatePosterPresentationData);

module.exports = router;
