const express = require('express');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorPassRequest = require('../models/ExhibitorPassRequest');
const DelegateRegistration = require('../models/DelegateRegistration');

const router = express.Router();

router.get('/admin/all', authMiddleware, async (_req, res) => {
    try {
        const [passRequests, delegateRegistrations] = await Promise.all([
            ExhibitorPassRequest.find({ passType: { $ne: 'vehicle' } })
                .populate('exhibitorId', 'exhibitorName registrationId participation contact1').lean(),
            DelegateRegistration.find({ registrationSource: 'exhibitor', exhibitorId: { $ne: null } })
                .populate('exhibitorId', 'exhibitorName registrationId participation contact1').lean(),
        ]);
        const delegateRequests = delegateRegistrations.map(registration => ({
            _id: registration._id, exhibitorId: registration.exhibitorId, passType: 'delegate', quantity: 1,
            personnel: [{ name: registration.fullName, email: registration.email, phone: registration.mobile, designation: registration.designation, photoUrl: registration.profileImage }],
            status: registration.paymentStatus === 'paid' ? 'approved' : registration.paymentStatus === 'failed' ? 'rejected' : 'pending',
            source: 'delegate_registration', registrationId: registration.regNo,
            createdAt: registration.createdAt, updatedAt: registration.updatedAt,
        }));
        const requests = [...passRequests, ...delegateRequests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
