const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const whyVisitController = require('../controllers/whyVisitController');

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

// Multer for why-visit reason card images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/why-visit');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `visit-${Date.now()}${path.extname(file.originalname)}`);
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

// GET /api/why-visit — public
router.get('/', (req, res) => whyVisitController.getContent(req, res));

// POST /api/why-visit/headings — update section headings
router.post('/headings', verifyToken, (req, res) => whyVisitController.updateHeadings(req, res));

// POST /api/why-visit/reasons — add a new reason card
router.post('/reasons', verifyToken, (req, res) => whyVisitController.addReason(req, res));

// PUT /api/why-visit/reasons/:reasonId — update reason card
router.put('/reasons/:reasonId', verifyToken, (req, res) => whyVisitController.updateReason(req, res));

// DELETE /api/why-visit/reasons/:reasonId
router.delete('/reasons/:reasonId', verifyToken, (req, res) => whyVisitController.deleteReason(req, res));

// POST /api/why-visit/image — upload image
router.post('/image', verifyToken, upload.single('image'), (req, res) => whyVisitController.uploadImage(req, res));

module.exports = router;
