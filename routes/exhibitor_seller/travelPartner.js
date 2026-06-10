const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const travelPartnerController = require('../../controllers/exhibitor_seller/travelPartnerController');

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
        const uploadPath = path.join(__dirname, '../uploads/travelpartner');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `travel-partner-${Date.now()}${path.extname(file.originalname)}`);
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

// @route   GET /api/travel-partner
// @desc    Get travel partner data
// router.get('/', (req, res) => travelPartnerController.getData(req, res));
router.get('/', (req, res) => travelPartnerController.getData(req, res));

// @route   PUT /api/travel-partner
// @desc    Update travel partner text data
// router.put('/', verifyToken, (req, res) => travelPartnerController.updateData(req, res));
router.put('/', verifyToken, (req, res) => travelPartnerController.updateData(req, res));

// @route   POST /api/travel-partner/upload
// @desc    Upload travel partner images
router.post('/upload', verifyToken, upload.single('image'), (req, res) => travelPartnerController.uploadPhoto(req, res));

module.exports = router;
