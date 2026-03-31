const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const marqueeController = require('../controllers/marqueeController');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

// @route   GET /api/marquee
// @desc    Get marquee settings
router.get('/', (req, res) => marqueeController.getMarquee(req, res));

// @route   POST /api/marquee
// @desc    Update marquee settings
router.post('/', verifyToken, (req, res) => marqueeController.updateMarquee(req, res));

module.exports = router;
