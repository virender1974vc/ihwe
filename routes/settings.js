const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const settingsController = require('../controllers/settingsController');

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

// Multer storage for logo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/settings');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        let prefix = 'asset';
        if (file.fieldname === 'logo') prefix = 'logo';
        else if (file.fieldname === 'exhibitorBrochurePdf') prefix = 'brochure';
        else if (file.fieldname === 'authorizedSignature') prefix = 'signature';
        else if (file.fieldname === 'companyStamp') prefix = 'stamp';
        cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// @route   GET /api/settings
// @desc    Get system settings
router.get('/', (req, res) => settingsController.getSettings(req, res));

// @route   PUT /api/settings
// @desc    Update system settings
router.put('/', verifyToken, upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'exhibitorBrochurePdf', maxCount: 1 },
    { name: 'authorizedSignature', maxCount: 1 },
    { name: 'companyStamp', maxCount: 1 }
]), (req, res) => settingsController.updateSettings(req, res));

module.exports = router;
