const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../utils/verifyToken');

// Get stats (Protected)
router.get('/stats', verifyToken, (req, res) => dashboardController.getStats(req, res));

module.exports = router;
