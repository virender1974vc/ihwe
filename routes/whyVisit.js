const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WhyVisit = require('../models/WhyVisit');

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

// Multer for why-visit reason card images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/why-visit');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `visit-${Date.now()}${path.extname(file.originalname)}`);
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

// GET /api/why-visit — public
router.get('/', async (req, res) => {
    try {
        let data = await WhyVisit.findOne();
        if (!data) {
            data = await new WhyVisit({}).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch why visit error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/why-visit/headings — update section headings
router.post('/headings', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText, shortDescription } = req.body;
        let data = await WhyVisit.findOne();
        if (!data) {
            data = new WhyVisit({ subheading, heading, highlightText, shortDescription });
        } else {
            data.subheading = subheading;
            data.heading = heading;
            data.highlightText = highlightText;
            data.shortDescription = shortDescription;
            data.lastUpdated = Date.now();
        }
        await data.save();
        res.json({ success: true, data, message: 'Headings updated' });
    } catch (error) {
        console.error('Update headings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/why-visit/reasons — add a new reason card
router.post('/reasons', verifyToken, async (req, res) => {
    try {
        const { title, description, icon, image, imageAlt, accent, buttonName, buttonLink } = req.body;
        let data = await WhyVisit.findOne();
        if (!data) data = new WhyVisit({});
        data.reasons.push({ title, description, icon, image, imageAlt, accent, buttonName, buttonLink });
        data.lastUpdated = Date.now();
        await data.save();
        res.json({ success: true, data, message: 'Reason card added' });
    } catch (error) {
        console.error('Add reason card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/why-visit/reasons/:reasonId — update reason card
router.put('/reasons/:reasonId', verifyToken, async (req, res) => {
    try {
        const { title, description, icon, image, imageAlt, accent, buttonName, buttonLink } = req.body;
        const data = await WhyVisit.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        const reason = data.reasons.id(req.params.reasonId);
        if (!reason) return res.status(404).json({ success: false, message: 'Reason not found' });
        reason.title = title;
        reason.description = description;
        reason.icon = icon;
        reason.image = image;
        reason.imageAlt = imageAlt;
        reason.accent = accent;
        reason.buttonName = buttonName;
        reason.buttonLink = buttonLink;
        data.lastUpdated = Date.now();
        await data.save();
        res.json({ success: true, data, message: 'Reason updated' });
    } catch (error) {
        console.error('Update reason error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/why-visit/reasons/:reasonId
router.delete('/reasons/:reasonId', verifyToken, async (req, res) => {
    try {
        const data = await WhyVisit.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        data.reasons = data.reasons.filter(r => r._id.toString() !== req.params.reasonId);
        data.lastUpdated = Date.now();
        await data.save();
        res.json({ success: true, message: 'Reason deleted' });
    } catch (error) {
        console.error('Delete reason error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/why-visit/image — upload image
router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const imageUrl = `/uploads/why-visit/${req.file.filename}`;
        res.json({ success: true, imageUrl, message: 'Image uploaded' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
