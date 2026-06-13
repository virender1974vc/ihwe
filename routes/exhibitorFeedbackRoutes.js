const express = require('express');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorFeedback = require('../models/ExhibitorFeedback');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');

const router = express.Router();

router.get('/my', protectExhibitor, async (req, res) => {
    try {
        const feedback = await ExhibitorFeedback.findOne({ exhibitorId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/submit', protectExhibitor, async (req, res) => {
    try {
        const exhibitor = await ExhibitorRegistration.findById(req.user.id);
        if (!exhibitor) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        const existing = await ExhibitorFeedback.findOne({ exhibitorId: req.user.id });
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
