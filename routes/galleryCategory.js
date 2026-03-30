const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryCategory = require('../models/GalleryCategory');

// Storage for category cover images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/gallery/categories';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET all categories (optionally filter by type)
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.type) {
            query.type = req.query.type;
        }
        const categories = await GalleryCategory.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create new category (with optional image)
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, heading, coverImageAlt, type } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        const coverImage = req.file
            ? `/uploads/gallery/categories/${req.file.filename}`
            : req.body.coverImage || '';

        const category = new GalleryCategory({ 
            title, 
            heading, 
            coverImage, 
            coverImageAlt,
            type: type || 'gallery' 
        });
        await category.save();
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update category (with optional image)
router.put('/:id', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, heading, coverImageAlt, type } = req.body;
        const update = { title, heading, coverImageAlt };
        if (type) update.type = type;
        if (req.file) update.coverImage = `/uploads/gallery/categories/${req.file.filename}`;
        
        const category = await GalleryCategory.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE category
router.delete('/:id', async (req, res) => {
    try {
        const category = await GalleryCategory.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
