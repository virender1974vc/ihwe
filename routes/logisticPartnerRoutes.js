const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const logisticPartnerController = require('../controllers/logisticPartnerController');
const path = require('path');
const fs = require('fs');

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

// Configure Cloudinary storage specifically for logistics partner images
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'ihwe_logistics',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' } // Compression ≤ 100kb
            ]
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed'));
    }
});

// GET dynamic logistics partner configuration (Public)
router.get('/', (req, res) => logisticPartnerController.getData(req, res));

// PUT update logistics partner details (Admin Only)
router.put('/', verifyToken, (req, res) => logisticPartnerController.updateData(req, res));

// POST upload logistics background/icon (Admin Only)
router.post('/upload', verifyToken, upload.single('image'), (req, res) => logisticPartnerController.uploadPhoto(req, res));

module.exports = router;
