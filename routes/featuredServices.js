const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const FeaturedServices = require('../models/FeaturedServices');

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

// Multer for service card images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/featured-services');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `service-${Date.now()}${path.extname(file.originalname)}`);
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

// GET /api/featured-services — public
router.get('/', async (req, res) => {
    try {
        let data = await FeaturedServices.findOne();
        if (!data) {
            data = await new FeaturedServices({}).save();
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error('Fetch featured services error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/featured-services/headings — update section headings
router.post('/headings', verifyToken, async (req, res) => {
    try {
        const { subheading, heading, highlightText, description } = req.body;
        let data = await FeaturedServices.findOne();
        if (!data) {
            data = new FeaturedServices({ subheading, heading, highlightText, description });
        } else {
            data.subheading = subheading;
            data.heading = heading;
            data.highlightText = highlightText;
            data.description = description;
            data.updatedAt = Date.now();
        }
        await data.save();
        res.json({ success: true, data, message: 'Headings updated successfully' });
    } catch (error) {
        console.error('Update headings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/featured-services/cards — add a new card
router.post('/cards', verifyToken, async (req, res) => {
    try {
        const { title, description, icon, image, imageAlt, accent, buttonText, buttonUrl } = req.body;
        let data = await FeaturedServices.findOne();
        if (!data) data = new FeaturedServices({});
        const order = data.cards.length;
        data.cards.push({ title, description, icon, image, imageAlt, accent, buttonText, buttonUrl, order });
        data.updatedAt = Date.now();
        await data.save();
        res.json({ success: true, data, message: 'Card added successfully' });
    } catch (error) {
        console.error('Add card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/featured-services/cards/:cardId — update card
router.put('/cards/:cardId', verifyToken, async (req, res) => {
    try {
        const { title, description, icon, image, imageAlt, accent, buttonText, buttonUrl } = req.body;
        const data = await FeaturedServices.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        const card = data.cards.id(req.params.cardId);
        if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
        card.title = title;
        card.description = description;
        card.icon = icon;
        card.image = image;
        card.imageAlt = imageAlt;
        card.accent = accent;
        card.buttonText = buttonText;
        card.buttonUrl = buttonUrl;
        data.updatedAt = Date.now();
        await data.save();
        res.json({ success: true, data, message: 'Card updated successfully' });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/featured-services/cards/:cardId
router.delete('/cards/:cardId', verifyToken, async (req, res) => {
    try {
        const data = await FeaturedServices.findOne();
        if (!data) return res.status(404).json({ success: false, message: 'Not found' });
        data.cards = data.cards.filter(c => c._id.toString() !== req.params.cardId);
        data.updatedAt = Date.now();
        await data.save();
        res.json({ success: true, message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/featured-services/image — upload image
router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const imageUrl = `/uploads/featured-services/${req.file.filename}`;
        res.json({ success: true, imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
