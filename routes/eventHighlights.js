const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const EventHighlights = require('../models/EventHighlights');

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
// @desc    Get event highlights data (creates default if none exists)
router.get('/', async (req, res) => {
    try {
        let data = await EventHighlights.findOne();
        if (!data) {
            data = await new EventHighlights({}).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch event highlights error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/event-highlights
// @desc    Update event highlights text data
router.put('/', verifyToken, async (req, res) => {
    try {
        const fields = [
            'subtitle', 'title', 'highlightText', 'countdownDate',
            'imageAlt', 'downloadButtonName',
            'eventDate', 'eventDay',
            'exhibitionHours', 'timezone',
            'venueName', 'venueAddress',
            'registerButtonName', 'registerButtonPath', 'isActive'
        ];

        const updateData = {};
        fields.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        let data = await EventHighlights.findOne();
        if (!data) {
            data = new EventHighlights(updateData);
        } else {
            Object.assign(data, updateData);
        }

        await data.save();
        res.json({ success: true, data, message: 'Event highlights updated successfully' });
    } catch (error) {
        console.error('Update event highlights error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/event-highlights/upload-image
// @desc    Upload event highlight image
router.post('/upload-image', verifyToken, uploadImage.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });

        const imagePath = `/uploads/event-highlights/${req.file.filename}`;

        let data = await EventHighlights.findOne();
        if (!data) data = new EventHighlights({});
        data.image = imagePath;
        await data.save();

        res.json({ success: true, imagePath, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/event-highlights/upload-pdf
// @desc    Upload brochure PDF
router.post('/upload-pdf', verifyToken, uploadPdf.single('pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a PDF' });

        const pdfPath = `/uploads/event-highlights/pdf/${req.file.filename}`;

        let data = await EventHighlights.findOne();
        if (!data) data = new EventHighlights({});
        data.pdfFile = pdfPath;
        await data.save();

        res.json({ success: true, pdfPath, message: 'PDF uploaded successfully' });
    } catch (error) {
        console.error('Upload PDF error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
