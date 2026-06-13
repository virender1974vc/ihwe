const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorPassConfig = require('../models/ExhibitorPassConfig');

const router = express.Router();

const defaultConfigs = [
    { passType: 'exhibitor', title: 'Exhibitor Pass', subtitle: 'For Your Team Members', complimentaryQuota: 2, totalQuota: 10, price: 150, displayOrder: 1 },
    { passType: 'vehicle', title: 'Vehicle Pass', subtitle: 'For Exhibitor Vehicles', complimentaryQuota: 2, totalQuota: 10, price: 500, displayOrder: 2 },
    { passType: 'service', title: 'Service Pass', subtitle: 'For Staff, Workers', complimentaryQuota: 4, totalQuota: 10, price: 150, displayOrder: 3 },
    { passType: 'visitor', title: 'Visitor Pass', subtitle: 'For Invited Visitors', complimentaryQuota: 10, totalQuota: 20, price: 200, displayOrder: 4 },
];

const ensureDefaults = async () => {
    const count = await ExhibitorPassConfig.countDocuments();
    if (count === 0) {
        await ExhibitorPassConfig.insertMany(defaultConfigs);
    }
};

router.get('/active', async (_req, res) => {
    try {
        await ensureDefaults();
        const configs = await ExhibitorPassConfig.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/all', authMiddleware, async (_req, res) => {
    try {
        await ensureDefaults();
        const configs = await ExhibitorPassConfig.find().sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/admin/:passType', authMiddleware, async (req, res) => {
    try {
        const payload = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            complimentaryQuota: Number(req.body.complimentaryQuota || 0),
            totalQuota: Number(req.body.totalQuota || 0),
            price: Number(req.body.price || 0),
            currency: req.body.currency || 'INR',
            maxPerRequest: Number(req.body.maxPerRequest || 10),
            isActive: req.body.isActive !== false,
            displayOrder: Number(req.body.displayOrder || 0)
        };

        const config = await ExhibitorPassConfig.findOneAndUpdate(
            { passType: req.params.passType },
            { $set: payload, $setOnInsert: { passType: req.params.passType } },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
