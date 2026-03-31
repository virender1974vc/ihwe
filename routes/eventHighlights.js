const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const eventHighlightsController = require('../controllers/eventHighlightsController');

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

// Multer storage for image
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/event-highlights');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `event-highlight-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Multer storage for PDF
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/event-highlights/pdf');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `brochure-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// @route   GET /api/event-highlights
// @desc    Get event highlights data
router.get('/', (req, res) => eventHighlightsController.getContent(req, res));

// @route   PUT /api/event-highlights
// @desc    Update event highlights text data
router.put('/', verifyToken, (req, res) => eventHighlightsController.updateContent(req, res));

// @route   POST /api/event-highlights/upload-image
// @desc    Upload event highlight image
router.post('/upload-image', verifyToken, uploadImage.single('image'), (req, res) => eventHighlightsController.uploadImage(req, res));

// @route   POST /api/event-highlights/upload-pdf
// @desc    Upload brochure PDF
router.post('/upload-pdf', verifyToken, uploadPdf.single('pdf'), (req, res) => eventHighlightsController.uploadPdf(req, res));

module.exports = router;
