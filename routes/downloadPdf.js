const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const DownloadPdf = require('../models/DownloadPdf');

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
// @desc    Get resources section data (creates default if none exists)
router.get('/', async (req, res) => {
    try {
        let data = await DownloadPdf.findOne();
        if (!data) {
            data = await new DownloadPdf({}).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch download-pdf error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/download-pdf/headings
// @desc    Update resources section headings
router.post('/headings', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightTitle, description } = req.body;
        let data = await DownloadPdf.findOne();
        if (!data) {
            data = new DownloadPdf({ subheading, heading, highlightTitle, description });
        } else {
            data.subheading = subheading;
            data.heading = heading;
            data.highlightTitle = highlightTitle;
            data.description = description;
        }
        await data.save();
        res.json({ success: true, data, message: 'Headings updated successfully' });
    } catch (error) {
        console.error('Update headings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/download-pdf/cards
// @desc    Add a new PDF resource card
router.post('/cards', verifyToken, async (req, res) => {
    try {
        const cardData = req.body;
        let data = await DownloadPdf.findOne();
        if (!data) data = new DownloadPdf({});
        data.cards.push(cardData);
        await data.save();
        res.json({ success: true, data: data.cards[data.cards.length - 1], message: 'Card added successfully' });
    } catch (error) {
        console.error('Add card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/download-pdf/cards/:id
// @desc    Update a PDF resource card
router.put('/cards/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const data = await DownloadPdf.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Data not found' });
        
        const cardIndex = data.cards.findIndex(c => c._id.toString() === id);
        if (cardIndex === -1) return res.status(404).json({ success: false, message: 'Card not found' });
        
        Object.assign(data.cards[cardIndex], updateData);
        await data.save();
        res.json({ success: true, data: data.cards[cardIndex], message: 'Card updated successfully' });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/download-pdf/cards/:id
// @desc    Delete a PDF resource card
router.delete('/cards/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await DownloadPdf.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Data not found' });
        
        data.cards = data.cards.filter(c => c._id.toString() !== id);
        await data.save();
        res.json({ success: true, message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/download-pdf/upload-image
// @desc    Upload resource cover image
router.post('/upload-image', verifyToken, uploadImage.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
    const imagePath = `/uploads/downloads/images/${req.file.filename}`;
    res.json({ success: true, url: imagePath, message: 'Image uploaded successfully' });
});

// @route   POST /api/download-pdf/upload-pdf
// @desc    Upload resource PDF file
router.post('/upload-pdf', verifyToken, uploadPdf.single('pdf'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PDF' });
    const pdfPath = `/uploads/downloads/pdf/${req.file.filename}`;
    res.json({ success: true, url: pdfPath, message: 'PDF uploaded successfully' });
});

module.exports = router;
