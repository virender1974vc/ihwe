const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const heroBackgroundController = require('../controllers/heroBackgroundController');

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

// Multer for background images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/hero-bg');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `hero-bg-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/hero-background — Get all
router.get('/', (req, res) => heroBackgroundController.getAllHeroBackgrounds(req, res));

// GET /api/hero-background/:id — Get by ID
router.get('/:id', (req, res) => heroBackgroundController.getHeroBackgroundById(req, res));

// POST /api/hero-background/create
router.post('/create', verifyToken, upload.single('backgroundImage'), (req, res) => heroBackgroundController.createHeroBackground(req, res));

// PUT /api/hero-background/update/:id
router.put('/update/:id', verifyToken, upload.single('backgroundImage'), (req, res) => heroBackgroundController.updateHeroBackground(req, res));

// DELETE /api/hero-background/delete/:id
router.delete('/delete/:id', verifyToken, (req, res) => heroBackgroundController.deleteHeroBackground(req, res));

module.exports = router;
