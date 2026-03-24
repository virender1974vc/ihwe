const express = require('express');
const router = express.Router();
const Seo = require('../models/Seo');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for OG Image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/seo/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'og-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create or Update SEO
router.post('/create', upload.single('ogImage'), async (req, res) => {
    try {
        const { page, metaTitle, metaKeywords, metaDescription, openGraphTags, schemaMarkup, canonicalTag, isActive } = req.body;
        
        const updateData = {
            page,
            metaTitle,
            metaKeywords,
            metaDescription,
            openGraphTags,
            schemaMarkup,
            canonicalTag,
            isActive: isActive === 'true' || isActive === true
        };

        if (req.file) {
            updateData.ogImage = `/uploads/seo/${req.file.filename}`;
        }

        const seo = await Seo.findOneAndUpdate(
            { page },
            updateData,
            { new: true, upsert: true }
        );

        res.json({ success: true, message: 'SEO data saved successfully', data: seo });
    } catch (error) {
        console.error('SEO Create error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all SEO modules (for admin list)
router.get('/all', async (req, res) => {
    try {
        const seoList = await Seo.find().sort({ updatedAt: -1 });
        res.json({ success: true, data: seoList });
    } catch (error) {
        console.error('SEO List error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update by ID
router.put('/update/:id', upload.single('ogImage'), async (req, res) => {
    try {
        const { metaTitle, metaKeywords, metaDescription, openGraphTags, schemaMarkup, canonicalTag, isActive } = req.body;
        
        const updateData = {
            metaTitle,
            metaKeywords,
            metaDescription,
            openGraphTags,
            schemaMarkup,
            canonicalTag,
            isActive: isActive === 'true' || isActive === true
        };

        if (req.file) {
            updateData.ogImage = `/uploads/seo/${req.file.filename}`;
        }

        const seo = await Seo.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!seo) {
            return res.status(404).json({ success: false, message: 'SEO data not found' });
        }

        res.json({ success: true, message: 'SEO data updated successfully', data: seo });
    } catch (error) {
        console.error('SEO Update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete SEO
router.delete('/delete/:id', async (req, res) => {
    try {
        await Seo.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'SEO data deleted successfully' });
    } catch (error) {
        console.error('SEO Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get SEO for a specific page (for website)
router.get('/page', async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ success: false, message: 'Path is required' });
        }

        const seo = await Seo.findOne({ page: path, isActive: true });
        res.json({ success: true, data: seo });
    } catch (error) {
        console.error('SEO Fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
