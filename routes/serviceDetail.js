const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const serviceDetailController = require('../controllers/serviceDetailController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Multer for hero images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/service-pages');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Routes
router.get('/', serviceDetailController.getAll);
router.get('/:cardId', serviceDetailController.getByCardId);
router.get('/slug/:slug', serviceDetailController.getBySlug);
router.post('/save', verifyToken, serviceDetailController.save);
router.delete('/:id', verifyToken, serviceDetailController.delete);

// Image upload
router.post('/upload', verifyToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const imageUrl = `/uploads/service-pages/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

module.exports = router;
