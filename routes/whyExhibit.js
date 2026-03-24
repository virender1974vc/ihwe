const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WhyExhibit = require('../models/WhyExhibit');

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

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/exhibit');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `exhibit-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

// Get content
router.get('/', async (req, res) => {
    try {
        let content = await WhyExhibit.findOne();
        if (!content) {
            content = await WhyExhibit.create({
                subheading: 'Empower Your Business',
                heading: 'Drive Growth & Innovation',
                highlightText: 'Growth & Innovation',
                shortDescription: 'Join IH&WE 2026 to connect with global innovators and access new market opportunities through our specialized exhibitor platforms and elite networking events.',
                benefits: []
            });
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Headings
router.post('/headings', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText, shortDescription } = req.body;
        const content = await WhyExhibit.findOneAndUpdate(
            {},
            { subheading, heading, highlightText, shortDescription, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add Benefit
router.post('/benefits', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description, buttonName, buttonLink, imageAlt, accent, icon } = req.body;
        let benefitData = { title, description, buttonName, buttonLink, imageAlt, accent, icon };
        
        if (req.file) {
            benefitData.image = `/uploads/exhibit/${req.file.filename}`;
        }

        const content = await WhyExhibit.findOneAndUpdate(
            {},
            { $push: { benefits: benefitData }, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Benefit
router.put('/benefits/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description, buttonName, buttonLink, imageAlt, accent, icon } = req.body;
        const content = await WhyExhibit.findOne();
        const benefit = content.benefits.id(req.params.id);
        
        if (benefit) {
            benefit.title = title;
            benefit.description = description;
            benefit.buttonName = buttonName;
            benefit.buttonLink = buttonLink;
            benefit.imageAlt = imageAlt;
            benefit.accent = accent;
            benefit.icon = icon;
            if (req.file) {
                benefit.image = `/uploads/exhibit/${req.file.filename}`;
            }
            content.lastUpdated = Date.now();
            await content.save();
        }
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Benefit
router.delete('/benefits/:id', verifyToken, async (req, res) => {
    try {
        const content = await WhyExhibit.findOneAndUpdate(
            {},
            { $pull: { benefits: { _id: req.params.id } }, lastUpdated: Date.now() },
            { new: true }
        );
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update CTA Section
router.post('/cta', verifyToken, upload.single('ctaImage'), async (req, res) => {
    try {
        const { 
            ctaTitle, ctaHighlightText, ctaDescription, 
            ctaButton1Name, ctaButton1Link, ctaButton2Name, ctaButton2Link, 
            ctaImageAlt 
        } = req.body;
        
        let updateData = { 
            ctaTitle, ctaHighlightText, ctaDescription, 
            ctaButton1Name, ctaButton1Link, ctaButton2Name, ctaButton2Link, 
            ctaImageAlt, 
            lastUpdated: Date.now() 
        };
        
        if (req.file) {
            updateData.ctaImage = `/uploads/exhibit/${req.file.filename}`;
        }

        const content = await WhyExhibit.findOneAndUpdate(
            {},
            updateData,
            { upsert: true, new: true }
        );
        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
