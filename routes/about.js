const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const aboutController = require('../controllers/aboutController');

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
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
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
// @desc    Get about data
router.get('/', (req, res) => aboutController.getAboutData(req, res));

// @route   PUT /api/about
// @desc    Update about text data
router.put('/', verifyToken, (req, res) => aboutController.updateAboutText(req, res));

// @route   POST /api/about/video
// @desc    Upload video for about section
router.post('/video', verifyToken, uploadVideo.single('video'), (req, res) => aboutController.updateAboutVideo(req, res));

module.exports = router;
