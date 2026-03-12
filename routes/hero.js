const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Hero = require('../models/Hero');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/hero');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-${Date.now()}${path.extname(file.originalname)}`);
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
        cb(new Error('Only images are allowed'));
    }
});

// @route   POST /api/hero/create
// @desc    Create a new hero slide
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { subtitle, title, description, altText, button1Name, button1Url, button2Name, button2Url, isActive, schedule } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        const newSlide = new Hero({
            image: `/uploads/hero/${req.file.filename}`,
            subtitle,
            title,
            description,
            altText,
            button1Name,
            button1Url,
            button2Name,
            button2Url,
            isActive: isActive === 'true' || isActive === true,
            schedule: schedule ? JSON.parse(schedule) : undefined
        });

        await newSlide.save();
        res.status(201).json({ success: true, data: newSlide });
    } catch (error) {
        console.error('Create hero slide error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/hero/all
// @desc    Get all hero slides
router.get('/all', async (req, res) => {
    try {
        const slides = await Hero.find().sort({ createdAt: 1 });
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Fetch hero slides error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/hero/update/:id
// @desc    Update a hero slide
router.put('/update/:id', upload.single('image'), async (req, res) => {
    try {
        const { subtitle, title, description, altText, button1Name, button1Url, button2Name, button2Url, isActive, schedule } = req.body;

        let updateData = {
            subtitle,
            title,
            description,
            altText,
            button1Name,
            button1Url,
            button2Name,
            button2Url,
            isActive: isActive === 'true' || isActive === true,
            schedule: schedule ? JSON.parse(schedule) : undefined
        };

        if (req.file) {
            updateData.image = `/uploads/hero/${req.file.filename}`;
            // Optional: Delete old image
        }

        const updatedSlide = await Hero.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedSlide) {
            return res.status(404).json({ success: false, message: 'Slide not found' });
        }

        res.json({ success: true, data: updatedSlide });
    } catch (error) {
        console.error('Update hero slide error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/hero/delete/:id
// @desc    Delete a hero slide
router.delete('/delete/:id', async (req, res) => {
    try {
        const slide = await Hero.findByIdAndDelete(req.params.id);
        if (!slide) {
            return res.status(404).json({ success: false, message: 'Slide not found' });
        }
        // Optional: Delete image from disk
        res.json({ success: true, message: 'Slide deleted successfully' });
    } catch (error) {
        console.error('Delete hero slide error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
