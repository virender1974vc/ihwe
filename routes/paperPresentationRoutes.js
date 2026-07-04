const express = require('express');
const router = express.Router();
const { getPaperPresentationData, updatePaperPresentationData } = require('../controllers/paperPresentationController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(getPaperPresentationData)
    .put(authMiddleware, adminMiddleware, updatePaperPresentationData);

module.exports = router;
