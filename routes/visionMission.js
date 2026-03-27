const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const visionMissionController = require('../controllers/visionMissionController');

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token is invalid' });
        req.user = user;
        next();
    });
};

// Get Vision & Mission content
router.get('/', (req, res) => visionMissionController.getContent(req, res));

// Update Vision & Mission content
router.post('/update', verifyToken, (req, res) => visionMissionController.updateContent(req, res));

module.exports = router;
