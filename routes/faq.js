const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const faqController = require('../controllers/faqController');

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

// Multer for FAQ images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/faq');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `faq-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/faq — public
router.get('/', (req, res) => faqController.getFAQ(req, res));

// POST /api/faq/headings — update section headings
router.post('/headings', verifyToken, (req, res) => faqController.updateHeadings(req, res));

// POST /api/faq/items — add a new FAQ item
router.post('/items', verifyToken, (req, res) => faqController.addItem(req, res));

// PUT /api/faq/items/:itemId — update item
router.put('/items/:itemId', verifyToken, (req, res) => faqController.updateItem(req, res));

// DELETE /api/faq/items/:itemId
router.delete('/items/:itemId', verifyToken, (req, res) => faqController.deleteItem(req, res));

// POST /api/faq/image — upload image
router.post('/image', verifyToken, upload.single('image'), (req, res) => faqController.uploadImage(req, res));

module.exports = router;
