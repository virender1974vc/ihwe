const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const downloadPdfController = require('../controllers/downloadPdfController');

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
        const uploadPath = path.join(__dirname, '../uploads/downloads/images');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `download-img-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Multer storage for PDF
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/downloads/pdf');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `resource-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadImage = multer({
    storage: imageStorage,
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

const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// @route   GET /api/download-pdf
router.get('/', (req, res) => downloadPdfController.getResourcesData(req, res));

// @route   POST /api/download-pdf/headings
router.post('/headings', verifyToken, (req, res) => downloadPdfController.updateHeadings(req, res));

// @route   POST /api/download-pdf/cards
router.post('/cards', verifyToken, (req, res) => downloadPdfController.addCard(req, res));

// @route   PUT /api/download-pdf/cards/:id
router.put('/cards/:id', verifyToken, (req, res) => downloadPdfController.updateCard(req, res));

// @route   DELETE /api/download-pdf/cards/:id
router.delete('/cards/:id', verifyToken, (req, res) => downloadPdfController.deleteCard(req, res));

// @route   POST /api/download-pdf/upload-image
router.post('/upload-image', verifyToken, uploadImage.single('image'), (req, res) => downloadPdfController.uploadImage(req, res));

// @route   POST /api/download-pdf/upload-pdf
router.post('/upload-pdf', verifyToken, uploadPdf.single('pdf'), (req, res) => downloadPdfController.uploadPdf(req, res));

module.exports = router;
