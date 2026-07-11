const express = require('express');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorFeedback = require('../models/ExhibitorFeedback');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/exhibitor-feedback');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.get('/my', protectExhibitor, async (req, res) => {
    try {
        const exhibitorId = req.query.regId || req.user.id;
        const feedback = await ExhibitorFeedback.findOne({ exhibitorId }).sort({ createdAt: -1 });
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/upload', protectExhibitor, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/exhibitor-feedback/${req.file.filename}`;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/submit', protectExhibitor, async (req, res) => {
    try {
        const exhibitorId = req.body.regId || req.user.id;
        const exhibitor = await ExhibitorRegistration.findById(exhibitorId);
        if (!exhibitor) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const existing = await ExhibitorFeedback.findOne({ exhibitorId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Feedback already submitted' });
        }

        const feedback = await ExhibitorFeedback.create({
            exhibitorId: exhibitor._id,
            registrationId: exhibitor.registrationId,
            exhibitorName: req.body.exhibitorName,
            companyName: req.body.companyName || exhibitor.exhibitorName,
            stallNumber: req.body.stallNumber,
            hallNumber: req.body.hallNumber,
            productCategory: req.body.productCategory,
            mobileNumber: req.body.mobileNumber,
            emailId: req.body.emailId,
            responses: req.body
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/all', authMiddleware, async (_req, res) => {
    try {
        const feedback = await ExhibitorFeedback.find()
            .populate('exhibitorId', 'exhibitorName registrationId participation')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/:id', authMiddleware, async (req, res) => {
    try {
        const feedback = await ExhibitorFeedback.findById(req.params.id)
            .populate('exhibitorId', 'exhibitorName registrationId participation');
        if (!feedback) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/admin/:id/review', authMiddleware, async (req, res) => {
    try {
        const feedback = await ExhibitorFeedback.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status || 'reviewed', reviewedBy: req.body.reviewedBy || 'Admin', reviewedAt: new Date() },
            { returnDocument: 'after' }
        );
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
