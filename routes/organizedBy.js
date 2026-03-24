const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const OrganizedBy = require('../models/OrganizedBy');

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

// Multer storage for logo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/organized');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `org-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images/SVGs are allowed'));
    }
});

// Get content
router.get('/', async (req, res) => {
    try {
        let content = await OrganizedBy.findOne();
        if (!content) {
            content = await OrganizedBy.create({
                subheading: 'The Visionaries',
                heading: 'Organized By',
                highlightText: 'By',
                badgeText: 'Non-Profit Organization',
                orgName: 'Namo Gange Trust',
                quote: 'The Expo is proudly organized by Namo Gange Trust, a non-profit organization working towards the integration of traditional and modern wellness systems for a healthier, more conscious society.',
                logoAlt: 'Namo Gange Trust'
            });
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update content
router.post('/update', verifyToken, upload.single('logo'), async (req, res) => {
    try {
        const { subheading, heading, highlightText, badgeText, orgName, quote, logoAlt } = req.body;
        let updateData = { subheading, heading, highlightText, badgeText, orgName, quote, logoAlt, lastUpdated: Date.now() };
        
        if (req.file) {
            updateData.logo = `/uploads/organized/${req.file.filename}`;
        }

        const content = await OrganizedBy.findOneAndUpdate({}, updateData, { upsert: true, new: true });
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
