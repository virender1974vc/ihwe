const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const upcomingEventController = require('../controllers/upcomingEventController');

// JWT middleware for admin verification
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

// Public route for fetching events (to be used in the dashboard)
router.get('/', upcomingEventController.getAllEvents);

// Protected routes for admin operations
router.post('/', verifyToken, upcomingEventController.addEvent);
router.put('/:id', verifyToken, upcomingEventController.updateEvent);
router.delete('/:id', verifyToken, upcomingEventController.deleteEvent);

module.exports = router;
