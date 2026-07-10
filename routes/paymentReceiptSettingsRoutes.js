const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const paymentReceiptSettingsController = require('../controllers/paymentReceiptSettingsController');
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/payment-receipt-settings');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'headerLogoImage' ? 'header-logo' : 'event-logo';
        cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });
router.get('/', (req, res) => paymentReceiptSettingsController.getSettings(req, res));
router.get('/preview', verifyToken, (req, res) => paymentReceiptSettingsController.previewReceipt(req, res));
router.put('/', verifyToken, upload.fields([
    { name: 'eventLogoImage', maxCount: 1 },
    { name: 'headerLogoImage', maxCount: 1 }
]), (req, res) => paymentReceiptSettingsController.updateSettings(req, res));

module.exports = router;
