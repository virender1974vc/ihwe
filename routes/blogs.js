const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/blogs';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `blog-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Multi-file upload configuration
const blogUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 }
]);

// GET all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ date: -1 });
        res.json({ success: true, data: blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single blog by ID or Slug
router.get('/:idOrSlug', async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        let blog;
        
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            blog = await Blog.findById(idOrSlug);
        } else {
            blog = await Blog.findOne({ slug: idOrSlug });
        }

        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new blog
router.post('/', blogUpload, async (req, res) => {
    try {
        const data = req.body;
        
        if (!req.files || !req.files['image']) {
            return res.status(400).json({ success: false, message: 'Main image is required' });
        }

        const newBlog = new Blog({
            ...data,
            featured: data.featured === 'true' || data.featured === true,
            image: `/uploads/blogs/${req.files['image'][0].filename}`,
            ogImage: req.files['ogImage'] ? `/uploads/blogs/${req.files['ogImage'][0].filename}` : ''
        });

        await newBlog.save();
        res.status(201).json({ success: true, data: newBlog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH update blog
router.patch('/:id', blogUpload, async (req, res) => {
    try {
        const data = req.body;
        const updateData = { ...data };

        if (data.featured !== undefined) {
            updateData.featured = data.featured === 'true' || data.featured === true;
        }

        if (req.files && req.files['image']) {
            updateData.image = `/uploads/blogs/${req.files['image'][0].filename}`;
        }
        if (req.files && req.files['ogImage']) {
            updateData.ogImage = `/uploads/blogs/${req.files['ogImage'][0].filename}`;
        }

        const updated = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Blog not found' });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE blog
router.delete('/:id', async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
