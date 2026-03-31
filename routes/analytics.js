const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../utils/verifyToken');

// Log a click (Public)
router.post('/log', (req, res) => analyticsController.logClick(req, res));

// Get stats and logs (Protected)
router.get('/stats', verifyToken, (req, res) => analyticsController.getStats(req, res));

module.exports = router;
