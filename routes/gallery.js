const express = require('express');
const router = express.Router();
const GalleryItem = require('../models/GalleryItem');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage for gallery assets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './uploads/gallery';
        if (file.mimetype.startsWith('video/')) {
            dir = './uploads/gallery/videos';
        } else {
            dir = './uploads/gallery/images';
        }
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    }
});

// Get all gallery items (filtered by category if provided)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }
        const items = await GalleryItem.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new gallery item
router.post('/', async (req, res) => {
    try {
        const { title, description, category, mediaType, image, videoUrl, imageAlt } = req.body;
        const newItem = new GalleryItem({
            title,
            description,
            category,
            mediaType,
            image,
            videoUrl,
            imageAlt
        });
        await newItem.save();
        res.json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update gallery item
router.put('/:id', async (req, res) => {
    try {
        const { title, description, category, mediaType, image, videoUrl, imageAlt } = req.body;
        const item = await GalleryItem.findByIdAndUpdate(
            req.params.id,
            { title, description, category, mediaType, image, videoUrl, imageAlt },
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete gallery item
router.delete('/:id', async (req, res) => {
    try {
        const item = await GalleryItem.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }
        res.json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generic upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        
        const isVideo = req.file.mimetype.startsWith('video/');
        const relativePath = isVideo 
            ? `/uploads/gallery/videos/${req.file.filename}`
            : `/uploads/gallery/images/${req.file.filename}`;
            
        res.json({ success: true, url: relativePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
