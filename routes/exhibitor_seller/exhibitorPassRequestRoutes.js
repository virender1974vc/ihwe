const express = require('express');
const { protectExhibitor } = require('../../middleware/auth');
const { authMiddleware } = require('../../middleware/authMiddleware');
const ExhibitorPassRequest = require('../../models/exhibitor_seller/ExhibitorPassRequest');

const router = express.Router();

router.get('/admin/all', authMiddleware, async (_req, res) => {
    try {
        const requests = await ExhibitorPassRequest.find()
            .populate('exhibitorId', 'exhibitorName registrationId participation contact1')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/admin/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const request = await ExhibitorPassRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after' }
        ).populate('exhibitorId', 'exhibitorName registrationId participation contact1');
        if (!request) return res.status(404).json({ success: false, message: 'Pass request not found' });
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/exhibitor/:exhibitorId', protectExhibitor, async (req, res) => {
    try {
        const exhibitorId = String(req.user.id) === String(req.params.exhibitorId)
            ? req.params.exhibitorId
            : req.user.id;
        const requests = await ExhibitorPassRequest.find({ exhibitorId }).sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
