const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const callController = require('../controllers/callController');

// Flex authentication middleware to populate req.user from Bearer Token
const flexAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        } catch (_) {}
    }
    next();
};

// Configure Multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define calling routes
router.post('/upload', flexAuth, upload.single('audio'), callController.uploadCallLog);
router.get('/history', flexAuth, callController.getCallHistory);

module.exports = router;
