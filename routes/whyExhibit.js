const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const whyExhibitController = require('../controllers/whyExhibitController');

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
router.get('/', (req, res) => whyExhibitController.getContent(req, res));

// Update Headings
router.post('/headings', verifyToken, (req, res) => whyExhibitController.updateHeadings(req, res));

// Add Benefit
router.post('/benefits', verifyToken, upload.single('image'), (req, res) => whyExhibitController.addBenefit(req, res));

// Update Benefit
router.put('/benefits/:id', verifyToken, upload.single('image'), (req, res) => whyExhibitController.updateBenefit(req, res));

// Delete Benefit
router.delete('/benefits/:id', verifyToken, (req, res) => whyExhibitController.deleteBenefit(req, res));

// Update CTA Section
router.post('/cta', verifyToken, upload.single('ctaImage'), (req, res) => whyExhibitController.updateCTA(req, res));

module.exports = router;
