const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');

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
        cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// @route   GET /api/settings
// @desc    Get system settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await new Settings({}).save();
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/settings
// @desc    Update system settings
router.put('/', verifyToken, upload.single('logo'), async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});

        const { emails, phones, addresses, mapIframe, marqueeText, topbarDate } = req.body;

        if (req.file) {
            settings.logo = `/uploads/settings/${req.file.filename}`;
        }

        if (emails) settings.emails = JSON.parse(emails);
        if (phones) settings.phones = JSON.parse(phones);
        if (addresses) settings.addresses = JSON.parse(addresses);
        if (mapIframe !== undefined) settings.mapIframe = mapIframe;
        if (marqueeText !== undefined) settings.marqueeText = marqueeText;
        if (topbarDate !== undefined) settings.topbarDate = topbarDate;

        await settings.save();
        res.json({ success: true, data: settings, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
