const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const GlobalPlatform = require('../models/GlobalPlatform');

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

// Multer storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/global-platform');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `global-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
});

// @route   GET /api/global-platform
// @desc    Get Global Platform data (admin context included for consistency)
router.get('/', async (req, res) => {
    try {
        let data = await GlobalPlatform.findOne();
        if (!data) {
            // Create default data if none exists
            data = await new GlobalPlatform({
                descriptionHtml: '<p>The International Health & Wellness Expo (IH&WE) is one of India\'s largest and most impactful platforms dedicated to promoting holistic health, traditional systems of medicine, organic lifestyle, and wellness innovations.</p><p>It brings together industry leaders, professionals, government bodies, wellness brands, and the general public to explore and celebrate healthy living practices. IH&WE serves as a critical bridge between legacy wisdom and modern future-ready healthcare solutions.</p>'
            }).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch global-platform error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/global-platform/update
// @desc    Update Global Platform text fields
router.post('/update', verifyToken, async (req, res) => {
    try {
        const { subheading, title, highlightText, descriptionHtml, tagline, points, images } = req.body;

        let data = await GlobalPlatform.findOne();
        if (!data) {
            data = new GlobalPlatform({ subheading, title, highlightText, descriptionHtml, tagline, points, images });
        } else {
            data.subheading = subheading;
            data.title = title;
            data.highlightText = highlightText;
            data.descriptionHtml = descriptionHtml;
            data.tagline = tagline;
            data.points = points;
            data.images = images;
            data.updatedAt = Date.now();
        }

        await data.save();
        res.json({ success: true, data, message: 'Global Platform content updated successfully' });
    } catch (error) {
        console.error('Update global-platform error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/global-platform/image
// @desc    Upload image for a specific slot
router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
        const imageUrl = `/uploads/global-platform/${req.file.filename}`;
        res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
