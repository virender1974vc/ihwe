const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const whyAttendController = require('../controllers/whyAttendController');

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

// Get Why Attend content
router.get('/', (req, res) => whyAttendController.getContent(req, res));

// Update headings
router.post('/headings', verifyToken, (req, res) => whyAttendController.updateHeadings(req, res));

// Add card
router.post('/cards', verifyToken, (req, res) => whyAttendController.addCard(req, res));

// Update card
router.put('/cards/:id', verifyToken, (req, res) => whyAttendController.updateCard(req, res));

// Delete card
router.delete('/cards/:id', verifyToken, (req, res) => whyAttendController.deleteCard(req, res));

module.exports = router;
