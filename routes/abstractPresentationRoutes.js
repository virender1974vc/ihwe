const express = require('express');
const router = express.Router();
const { getAbstractPresentationData, updateAbstractPresentationData } = require('../controllers/abstractPresentationController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAbstractPresentationData)
    .put(authMiddleware, adminMiddleware, updateAbstractPresentationData);

module.exports = router;
