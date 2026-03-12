const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WhoWeAre = require('../models/WhoWeAre');

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
        const uploadPath = path.join(__dirname, '../uploads/who-we-are');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `who-${Date.now()}${path.extname(file.originalname)}`);
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

// @route   GET /api/who-we-are
// @desc    Get Who We Are data
router.get('/', async (req, res) => {
    try {
        let data = await WhoWeAre.findOne();
        if (!data) {
            data = await new WhoWeAre({
                description: 'The International Health & Wellness Expo has evolved into the premier gathering for healthcare innovation...'
            }).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch who-we-are error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/who-we-are
// @desc    Update Who We Are data
router.post('/', verifyToken, async (req, res) => {
    try {
        const { subheading, title, highlightText, description, points, images } = req.body;

        let data = await WhoWeAre.findOne();
        if (!data) {
            data = new WhoWeAre({ subheading, title, highlightText, description, points, images });
        } else {
            data.subheading = subheading;
            data.title = title;
            data.highlightText = highlightText;
            data.description = description;
            data.points = points;
            data.images = images;
            data.updatedAt = Date.now();
        }

        await data.save();
        res.json({ success: true, data, message: 'Who We Are content updated successfully' });
    } catch (error) {
        console.error('Update who-we-are error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/who-we-are/image
// @desc    Upload image
router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
        const imageUrl = `/uploads/who-we-are/${req.file.filename}`;
        res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
