const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Marquee = require('../models/Marquee');

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
router.get('/', async (req, res) => {
    try {
        let marquee = await Marquee.findOne();
        if (!marquee) {
            marquee = await new Marquee({}).save();
        }
        res.json({ success: true, data: marquee });
    } catch (error) {
        console.error('Fetch marquee error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/marquee
// @desc    Update marquee settings
router.post('/', verifyToken, async (req, res) => {
    try {
        const { text, bgColor } = req.body;
        let marquee = await Marquee.findOne();
        if (!marquee) {
            marquee = new Marquee({});
        }

        if (text !== undefined) marquee.text = text;
        if (bgColor !== undefined) marquee.bgColor = bgColor;

        await marquee.save();
        res.json({ success: true, data: marquee, message: 'Marquee updated successfully' });
    } catch (error) {
        console.error('Update marquee error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
