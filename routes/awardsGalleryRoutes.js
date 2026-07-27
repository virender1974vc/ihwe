const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const awardsGalleryController = require('../controllers/awardsGalleryController');

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

// Multer storage for gallery images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/awards-gallery');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `gallery-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

// Public routes
router.get('/', awardsGalleryController.getAll);

// Admin routes
router.get('/admin', verifyToken, awardsGalleryController.getAllAdmin);
router.get('/:id', verifyToken, awardsGalleryController.getById);
router.post('/', verifyToken, upload.single('image'), awardsGalleryController.create);
router.post('/bulk', verifyToken, upload.array('images', 20), awardsGalleryController.bulkCreate);
router.put('/:id', verifyToken, upload.single('image'), awardsGalleryController.update);
router.delete('/:id', verifyToken, awardsGalleryController.delete);

module.exports = router;
