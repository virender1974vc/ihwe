const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const serviceDetailController = require('../controllers/serviceDetailController');

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

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/service-details');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `serv-det-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadFields = upload.fields([
    { name: 'bgImage', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

// Routes
router.get('/', serviceDetailController.getAllServiceDetails);
router.get('/:name', serviceDetailController.getServiceDetail);
router.post('/', verifyToken, uploadFields, serviceDetailController.saveServiceDetail);
router.delete('/:name', verifyToken, serviceDetailController.deleteServiceDetail);

module.exports = router;
