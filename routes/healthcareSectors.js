const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const healthcareSectorsController = require('../controllers/healthcareSectorsController');

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

// Multer for sector card images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/healthcare-sectors');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `sector-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/healthcare-sectors — public
router.get('/', (req, res) => healthcareSectorsController.getHealthcareSectors(req, res));

// POST /api/healthcare-sectors/headings — update section headings
router.post('/headings', verifyToken, (req, res) => healthcareSectorsController.updateHeadings(req, res));

// POST /api/healthcare-sectors/cards — add a new card
router.post('/cards', verifyToken, (req, res) => healthcareSectorsController.addCard(req, res));

// PUT /api/healthcare-sectors/cards/:cardId — update card
router.put('/cards/:cardId', verifyToken, (req, res) => healthcareSectorsController.updateCard(req, res));

// DELETE /api/healthcare-sectors/cards/:cardId
router.delete('/cards/:cardId', verifyToken, (req, res) => healthcareSectorsController.deleteCard(req, res));

// POST /api/healthcare-sectors/image — upload image
router.post('/image', verifyToken, upload.single('image'), (req, res) => healthcareSectorsController.uploadImage(req, res));

module.exports = router;
