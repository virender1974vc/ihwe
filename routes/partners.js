const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const partnersController = require('../controllers/partnersController');

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

// Multer for partner logos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/partners');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `partner-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|avif/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

/**
 * ── GROUP ROUTES ──────────────────────────────────────────────────────────
 */

// GET /api/partners — public
router.get('/', (req, res) => partnersController.getAllGroups(req, res));

// POST /api/partners/groups — add a new group
router.post('/groups', verifyToken, (req, res) => partnersController.addGroup(req, res));

// PUT /api/partners/groups/:groupId — update group headings
router.put('/groups/:groupId', verifyToken, (req, res) => partnersController.updateGroup(req, res));

// DELETE /api/partners/groups/:groupId
router.delete('/groups/:groupId', verifyToken, (req, res) => partnersController.deleteGroup(req, res));

/**
 * ── PARTNER LOGO ROUTES ──────────────────────────────────────────────────
 */

// POST /api/partners/groups/:groupId/partners — add a partner to a group
router.post('/groups/:groupId/partners', verifyToken, (req, res) => partnersController.addPartner(req, res));

// PUT /api/partners/groups/:groupId/partners/:partnerId — update partner details
router.put('/groups/:groupId/partners/:partnerId', verifyToken, (req, res) => partnersController.updatePartner(req, res));

// DELETE /api/partners/groups/:groupId/partners/:partnerId
router.delete('/groups/:groupId/partners/:partnerId', verifyToken, (req, res) => partnersController.deletePartner(req, res));

// POST /api/partners/upload-logo — upload image
router.post('/upload-logo', verifyToken, upload.single('logo'), (req, res) => partnersController.uploadLogo(req, res));

module.exports = router;
