const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const PartnerGroup = require('../models/PartnerGroup');

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
router.get('/', async (req, res) => {
    try {
        const groups = await PartnerGroup.find().sort({ order: 1 });
        res.json({ success: true, data: groups });
    } catch (error) {
        console.error('Fetch partners error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/partners/groups — add a new group
router.post('/groups', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText } = req.body;
        const count = await PartnerGroup.countDocuments();
        const newGroup = new PartnerGroup({ subheading, heading, highlightText, order: count });
        await newGroup.save();
        res.json({ success: true, data: newGroup, message: 'Partner group added successfully' });
    } catch (error) {
        console.error('Add group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/partners/groups/:groupId — update group headings
router.put('/groups/:groupId', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText } = req.body;
        const group = await PartnerGroup.findByIdAndUpdate(
            req.params.groupId,
            { subheading, heading, highlightText, updatedAt: Date.now() },
            { new: true }
        );
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
        res.json({ success: true, data: group, message: 'Group updated successfully' });
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/partners/groups/:groupId
router.delete('/groups/:groupId', verifyToken, async (req, res) => {
    try {
        const group = await PartnerGroup.findByIdAndDelete(req.params.groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
        res.json({ success: true, message: 'Partner group deleted successfully' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * ── PARTNER LOGO ROUTES ──────────────────────────────────────────────────
 */

// POST /api/partners/groups/:groupId/partners — add a partner to a group
router.post('/groups/:groupId/partners', verifyToken, async (req, res) => {
    try {
        const { name, logo, imageAlt } = req.body;
        const group = await PartnerGroup.findById(req.params.groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        const order = group.partners.length;
        group.partners.push({ name, logo, imageAlt, order });
        group.updatedAt = Date.now();
        await group.save();

        res.json({ success: true, data: group, message: 'Partner added successfully' });
    } catch (error) {
        console.error('Add partner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/partners/groups/:groupId/partners/:partnerId — update partner details
router.put('/groups/:groupId/partners/:partnerId', verifyToken, async (req, res) => {
    try {
        const { name, logo, imageAlt } = req.body;
        const group = await PartnerGroup.findById(req.params.groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        const partner = group.partners.id(req.params.partnerId);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

        if (name !== undefined) partner.name = name;
        if (logo !== undefined) partner.logo = logo;
        if (imageAlt !== undefined) partner.imageAlt = imageAlt;

        group.updatedAt = Date.now();
        await group.save();

        res.json({ success: true, data: group, message: 'Partner updated successfully' });
    } catch (error) {
        console.error('Update partner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/partners/groups/:groupId/partners/:partnerId
router.delete('/groups/:groupId/partners/:partnerId', verifyToken, async (req, res) => {
    try {
        const group = await PartnerGroup.findById(req.params.groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        group.partners = group.partners.filter(p => p._id.toString() !== req.params.partnerId);
        group.updatedAt = Date.now();
        await group.save();

        res.json({ success: true, data: group, message: 'Partner deleted successfully' });
    } catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/partners/upload-logo — upload image
router.post('/upload-logo', verifyToken, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const imageUrl = `/uploads/partners/${req.file.filename}`;
        res.json({ success: true, imageUrl, message: 'Logo uploaded successfully' });
    } catch (error) {
        console.error('Logo upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
