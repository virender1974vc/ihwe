const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const whoShouldAttendController = require('../controllers/whoShouldAttendController');

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

// Multer storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/target');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `target-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Get content
router.get('/', (req, res) => whoShouldAttendController.getContent(req, res));

// Update Headings & Image
router.post('/headings', verifyToken, upload.single('image'), (req, res) => whoShouldAttendController.updateHeadings(req, res));

// Add Group
router.post('/groups', verifyToken, (req, res) => whoShouldAttendController.addGroup(req, res));

// Update Group (by index)
router.put('/groups/:index', verifyToken, (req, res) => whoShouldAttendController.updateGroup(req, res));

// Delete Group
router.delete('/groups/:index', verifyToken, (req, res) => whoShouldAttendController.deleteGroup(req, res));

module.exports = router;
