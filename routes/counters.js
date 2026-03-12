const express = require('express');
const router = express.Router();
const Counter = require('../models/Counter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/counters';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `counter-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// GET all counters
router.get('/', async (req, res) => {
    try {
        const counters = await Counter.find().sort({ order: 1 });
        res.json({ success: true, data: counters });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new counter
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { icon, end, suffix, label, altText, overlay } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Background image is required' });
        }

        const newCounter = new Counter({
            icon,
            end: Number(end),
            suffix,
            label,
            bg: `/uploads/counters/${req.file.filename}`,
            altText,
            overlay: Number(overlay) || 0.4
        });

        await newCounter.save();
        res.status(201).json({ success: true, data: newCounter });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update counter
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { icon, end, suffix, label, altText, overlay } = req.body;
        const updateData = {
            icon,
            end: Number(end),
            suffix,
            label,
            altText,
            overlay: Number(overlay)
        };

        if (req.file) {
            updateData.bg = `/uploads/counters/${req.file.filename}`;
        }

        const updated = await Counter.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Counter not found' });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE counter
router.delete('/:id', async (req, res) => {
    try {
        const counter = await Counter.findByIdAndDelete(req.params.id);
        if (!counter) return res.status(404).json({ success: false, message: 'Counter not found' });
        
        // Optionally delete associated file
        // const filePath = path.join(__dirname, '..', counter.bg);
        // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ success: true, message: 'Counter deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
