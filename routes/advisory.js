const express = require('express');
const router = express.Router();
const AdvisoryMember = require('../models/AdvisoryMember');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/advisory';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all advisory members
router.get('/', async (req, res) => {
    try {
        const members = await AdvisoryMember.find().sort({ createdAt: -1 });
        res.json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new advisory member
router.post('/', async (req, res) => {
    try {
        const { name, role, organization, image, imageAlt } = req.body;
        const newMember = new AdvisoryMember({
            name,
            role,
            organization,
            image,
            imageAlt
        });
        await newMember.save();
        res.json({ success: true, data: newMember });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update advisory member
router.put('/:id', async (req, res) => {
    try {
        const { name, role, organization, image, imageAlt } = req.body;
        const member = await AdvisoryMember.findByIdAndUpdate(
            req.params.id,
            { name, role, organization, image, imageAlt },
            { new: true }
        );
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }
        res.json({ success: true, data: member });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete advisory member
router.delete('/:id', async (req, res) => {
    try {
        const member = await AdvisoryMember.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }
        res.json({ success: true, message: "Member deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Image upload
router.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const relativePath = `/uploads/advisory/${req.file.filename}`;
        res.json({ success: true, url: relativePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
