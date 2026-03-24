const express = require('express');
const router = express.Router();
const multer = require('multer');
const Exhibitor = require('../models/Exhibitor');
const path = require('path');
const fs = require('fs');

// Multer Config for Image Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/exhibitors';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// GET all exhibitors
router.get('/', async (req, res) => {
    try {
        const exhibitors = await Exhibitor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: exhibitors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add new exhibitor
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, location, websiteUrl, altText } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const newExhibitor = new Exhibitor({
            title,
            location,
            websiteUrl,
            image: req.file.path,
            altText: altText || title
        });

        await newExhibitor.save();
        res.status(201).json({ success: true, message: 'Exhibitor added successfully', data: newExhibitor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update exhibitor
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, location, websiteUrl, altText } = req.body;
        let updateData = { title, location, websiteUrl, altText };

        if (req.file) {
            updateData.image = req.file.path;
            // Optionally delete old image
            const oldExhibitor = await Exhibitor.findById(req.params.id);
            if (oldExhibitor && oldExhibitor.image && fs.existsSync(oldExhibitor.image)) {
                fs.unlinkSync(oldExhibitor.image);
            }
        }

        const updatedExhibitor = await Exhibitor.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, message: 'Exhibitor updated successfully', data: updatedExhibitor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE exhibitor
router.delete('/:id', async (req, res) => {
    try {
        const exhibitor = await Exhibitor.findById(req.params.id);
        if (!exhibitor) {
            return res.status(404).json({ success: false, message: 'Exhibitor not found' });
        }

        if (exhibitor.image && fs.existsSync(exhibitor.image)) {
            fs.unlinkSync(exhibitor.image);
        }

        await Exhibitor.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Exhibitor deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
