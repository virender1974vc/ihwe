const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const About = require('../models/About');

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

// Multer storage for video
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/about');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `about-video-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg|mov/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});

// @route   GET /api/about
// @desc    Get about data (creates default if none exists)
router.get('/', async (req, res) => {
    try {
        let data = await About.findOne();
        if (!data) {
            data = await new About({}).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch about error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/about
// @desc    Update about text data
router.put('/', verifyToken, async (req, res) => {
    try {
        const { heading, subheading, highlightedWord, description, vision, mission } = req.body;

        let data = await About.findOne();
        if (!data) {
            data = new About({ heading, subheading, highlightedWord, description, vision, mission });
        } else {
            if (heading !== undefined) data.heading = heading;
            if (subheading !== undefined) data.subheading = subheading;
            if (highlightedWord !== undefined) data.highlightedWord = highlightedWord;
            if (description !== undefined) data.description = description;
            if (vision !== undefined) data.vision = vision;
            if (mission !== undefined) data.mission = mission;
        }

        await data.save();
        res.json({ success: true, data, message: 'About content updated successfully' });
    } catch (error) {
        console.error('Update about error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/about/video
// @desc    Upload video for about section
router.post('/video', verifyToken, uploadVideo.single('video'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a video file' });

        const videoPath = `/uploads/about/${req.file.filename}`;

        let data = await About.findOne();
        if (!data) data = new About({});
        data.video = videoPath;
        await data.save();

        res.json({ success: true, videoPath, message: 'Video uploaded successfully' });
    } catch (error) {
        console.error('Upload video error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
