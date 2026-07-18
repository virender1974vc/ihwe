const express = require('express');
const router = express.Router();
const certificateRecipientController = require('../controllers/certificateRecipientController');
const jwt = require('jsonwebtoken');

// JWT middleware
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

router.get('/', verifyToken, certificateRecipientController.getRecipients);
router.post('/', verifyToken, certificateRecipientController.addRecipient);
router.delete('/:id', verifyToken, certificateRecipientController.deleteRecipient);

module.exports = router;
