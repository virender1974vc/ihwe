const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WhoShouldAttend = require('../models/WhoShouldAttend');

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
        const uploadPath = path.join(__dirname, '../uploads/target');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `target-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Get content
router.get('/', async (req, res) => {
    try {
        let content = await WhoShouldAttend.findOne();
        if (!content) {
            content = await WhoShouldAttend.create({
                subheading: 'Target Audience',
                heading: 'Who Should Attend?',
                highlightText: 'Attend?',
                image: '/images/who2.png',
                imageAlt: 'Expo Attendees',
                groups: [
                    "Healthcare Professionals & AYUSH Practitioners",
                    "Wellness Coaches & Yoga Experts",
                    "Organic Product Companies",
                    "Hospitals, Clinics, and Medical Institutions",
                    "Pharma & Nutraceutical Brands",
                    "Health-Conscious Public"
                ]
            });
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Headings & Image
router.post('/headings', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { subheading, heading, highlightText, imageAlt } = req.body;
        let updateData = { subheading, heading, highlightText, imageAlt, lastUpdated: Date.now() };
        
        if (req.file) {
            updateData.image = `/uploads/target/${req.file.filename}`;
        }

        const content = await WhoShouldAttend.findOneAndUpdate({}, updateData, { upsert: true, new: true });
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add Group
router.post('/groups', verifyToken, async (req, res) => {
    try {
        const { group } = req.body;
        const content = await WhoShouldAttend.findOneAndUpdate(
            {},
            { $push: { groups: group }, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Group (by index)
router.put('/groups/:index', verifyToken, async (req, res) => {
    try {
        const { index } = req.params;
        const { group } = req.body;
        const content = await WhoShouldAttend.findOne();
        if (content) {
            content.groups[index] = group;
            content.lastUpdated = Date.now();
            await content.save();
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Group
router.delete('/groups/:index', verifyToken, async (req, res) => {
    try {
        const { index } = req.params;
        const content = await WhoShouldAttend.findOne();
        if (content) {
            content.groups.splice(index, 1);
            content.lastUpdated = Date.now();
            await content.save();
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
