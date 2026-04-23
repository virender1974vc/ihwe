const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryCategory = require('../models/GalleryCategory');
const GalleryItem = require('../models/GalleryItem');

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
        const categories = await GalleryCategory.find(query).sort({ order: 1, createdAt: -1 });
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
            type: type || 'gallery',
            order: req.body.order || 0
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
        const { title, heading, coverImageAlt, type, order } = req.body;
        
        // 1. Find existing to get old title
        const existingCategory = await GalleryCategory.findById(req.params.id);
        if (!existingCategory) return res.status(404).json({ success: false, message: 'Category not found' });
        
        const oldTitle = existingCategory.title;

        // 2. Prepare update object
        const update = { title, heading, coverImageAlt };
        if (order !== undefined) update.order = order;
        if (type) update.type = type;
        if (req.file) update.coverImage = `/uploads/gallery/categories/${req.file.filename}`;
        
        // 3. Update category
        const category = await GalleryCategory.findByIdAndUpdate(req.params.id, update, { new: true });
        
        // 4. CASCADE: If title changed, update all gallery items that used the old title
        if (title && title !== oldTitle) {
            console.log(`Cascading title change from "${oldTitle}" to "${title}"`);
            await GalleryItem.updateMany(
                { title: oldTitle }, 
                { title: title }
            );
        }

        res.json({ success: true, data: category });
    } catch (err) {
        console.error('Category Update Error:', err);
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
