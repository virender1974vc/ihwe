const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const certificateDataController = require('../controllers/certificateDataController');

// JWT middleware
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

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/certificate');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Define upload fields
const cpUpload = upload.fields([
    { name: 'expo_logo', maxCount: 1 },
    { name: 'sign1_image', maxCount: 1 },
    { name: 'sign2_image', maxCount: 1 },
    { name: 'namo_gange_trust_logos', maxCount: 24 },
    { name: 'concurrent_events', maxCount: 7 },
    { name: 'header_left_logo', maxCount: 1 },
    { name: 'header_center_logo', maxCount: 1 },
    { name: 'header_right_logo', maxCount: 1 },
    { name: 'certificate_title_image', maxCount: 1 }
]);

router.get('/', certificateDataController.getCertificateData);
router.post('/update', verifyToken, cpUpload, certificateDataController.updateCertificateData);

module.exports = router;
