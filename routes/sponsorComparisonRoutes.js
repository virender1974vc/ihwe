const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const sponsorComparisonController = require('../controllers/sponsorComparisonController');

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

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'ihwe_sponsors',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 400, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' } // Compression below 100kb
            ]
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// GET dynamic sponsorship configuration (Public)
router.get('/', (req, res) => sponsorComparisonController.getContent(req, res));

// POST update sponsorship cards and table (Admin Only)
router.post('/', verifyToken, (req, res) => sponsorComparisonController.saveContent(req, res));

// POST upload sponsor image/logo (Admin Only)
router.post('/upload', verifyToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const fileUrl = req.file.path;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
