const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const fabricationPartnerController = require('../controllers/fabricationPartnerController');

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

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/fabricationpartner');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `fabrication-partner-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp, svg) are allowed'));
    }
});

// @route   GET /api/fabrication-partner
// @desc    Get fabrication partner data
router.get('/', (req, res) => fabricationPartnerController.getData(req, res));

// @route   PUT /api/fabrication-partner
// @desc    Update fabrication partner text data
router.put('/', verifyToken, (req, res) => fabricationPartnerController.updateData(req, res));

// @route   POST /api/fabrication-partner/upload
// @desc    Upload fabrication partner images
router.post('/upload', verifyToken, upload.single('image'), (req, res) => fabricationPartnerController.uploadPhoto(req, res));

module.exports = router;
