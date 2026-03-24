const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const HeroBackground = require('../models/HeroBackground');

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

// Multer for background images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/hero-bg');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-bg-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/hero-background — Get all
router.get('/', async (req, res) => {
    try {
        const data = await HeroBackground.find().sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch hero-background error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/hero-background/:id — Get by ID
router.get('/:id', async (req, res) => {
    try {
        const data = await HeroBackground.findById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/hero-background/create
router.post('/create', verifyToken, upload.single('backgroundImage'), async (req, res) => {
    try {
        const { pageName, imageAltText, title, heading, shortDescription, status } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a background image' });
        }

        const newHero = new HeroBackground({
            pageName,
            backgroundImage: `/uploads/hero-bg/${req.file.filename}`,
            imageAltText,
            title,
            heading,
            shortDescription,
            status: status || 'Active'
        });

        await newHero.save();
        res.status(201).json({ success: true, data: newHero, message: 'Hero background created successfully' });
    } catch (error) {
        console.error('Create hero-background error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/hero-background/update/:id
router.put('/update/:id', verifyToken, upload.single('backgroundImage'), async (req, res) => {
    try {
        const { pageName, imageAltText, title, heading, shortDescription, status } = req.body;
        const updateData = { pageName, imageAltText, title, heading, shortDescription, status };

        if (req.file) {
            updateData.backgroundImage = `/uploads/hero-bg/${req.file.filename}`;
        }

        const data = await HeroBackground.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });

        res.json({ success: true, data, message: 'Hero background updated successfully' });
    } catch (error) {
        console.error('Update hero-background error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/hero-background/delete/:id
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const data = await HeroBackground.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        
        // Optional: delete image file from disk
        res.json({ success: true, message: 'Hero background deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
