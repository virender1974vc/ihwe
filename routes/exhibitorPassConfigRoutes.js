const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/authMiddleware');
const { protectExhibitor } = require('../middleware/auth');
const ExhibitorPassConfig = require('../models/ExhibitorPassConfig');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const eventService = require('../services/eventService');
const { computeEntitlement, computeVehicleEntitlements, getExhibitorStallArea } = require('../utils/entitlementCalculator');

const router = express.Router();

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);

const defaultConfigs = [
    { passType: 'exhibitor', title: 'Exhibitor Pass', subtitle: 'For Your Team Members', complimentaryQuota: 2, totalQuota: 10, price: 150, displayOrder: 1 },
    {
        passType: 'vehicle', title: 'Vehicle Pass', subtitle: 'For Exhibitor Vehicles', totalQuota: 10, displayOrder: 2,
        vehicleTypeConfig: {
            twoWheeler: { allocationMode: 'perArea', ratioQty: 2, ratioArea: 9, roundingMode: 'floor', complimentaryQuota: 2, price: 300 },
            fourWheeler: { allocationMode: 'perArea', ratioQty: 1, ratioArea: 24, roundingMode: 'floor', complimentaryQuota: 1, price: 800 },
        }
    },
    { passType: 'service', title: 'Service Pass', subtitle: 'For Staff, Workers', complimentaryQuota: 4, totalQuota: 10, price: 150, displayOrder: 3 },
    { passType: 'visitor', title: 'Visitor Pass', subtitle: 'For Invited Visitors', complimentaryQuota: 10, totalQuota: 20, price: 200, displayOrder: 4 },
    { passType: 'delegate', title: 'Delegate Pass', subtitle: 'For Conference Access', complimentaryQuota: 0, totalQuota: 0, price: 0, displayOrder: 5 },
];

// Lazily seeds an event's pass configs with the standard default set the first time
// anyone asks for that event's configs and none exist yet — so a brand new event isn't
// a blank page, without needing a separate "initialize" step in the admin UI.
const ensureDefaultsForEvent = async (eventId) => {
    const count = await ExhibitorPassConfig.countDocuments({ eventId });
    if (count > 0) return;
    await ExhibitorPassConfig.insertMany(defaultConfigs.map((cfg) => ({ ...cfg, eventId })));
};

const resolveExhibitorEventId = async (registrationId) => {
    const reg = await ExhibitorRegistration.findById(registrationId).select('eventId');
    return reg?.eventId || null;
};

router.get('/active', async (req, res) => {
    try {
        let { eventId } = req.query;
        if (!isValidId(eventId)) {
            // No eventId supplied (e.g. unauthenticated callers) — fall back to
            // whichever event is currently active, per Event Setup.
            const currentEvent = await eventService.getCurrentEvent();
            if (!currentEvent) {
                return res.status(404).json({ success: false, message: 'No active event found' });
            }
            eventId = currentEvent._id;
        }
        await ensureDefaultsForEvent(eventId);
        const configs = await ExhibitorPassConfig.find({ eventId, isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/my-active', protectExhibitor, async (req, res) => {
    try {
        const eventId = await resolveExhibitorEventId(req.user.id);
        if (!eventId) {
            return res.status(404).json({ success: false, message: 'No event linked to this registration' });
        }
        await ensureDefaultsForEvent(eventId);
        const configs = await ExhibitorPassConfig.find({ eventId, isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
        const stallArea = await getExhibitorStallArea(req.user.id);
        const data = configs.map((config) => {
            if (config.passType === 'vehicle') {
                const { twoWheeler, fourWheeler } = computeVehicleEntitlements(config, stallArea);
                return {
                    ...config.toObject(),
                    complimentaryQuota: twoWheeler + fourWheeler,
                    complimentaryQuotaTwoWheeler: twoWheeler,
                    complimentaryQuotaFourWheeler: fourWheeler,
                };
            }
            const complimentaryQuota = computeEntitlement({
                allocationMode: config.allocationMode,
                ratioQty: config.ratioQty,
                ratioArea: config.ratioArea,
                roundingMode: config.roundingMode,
                fixedQty: config.complimentaryQuota,
            }, stallArea);
            return { ...config.toObject(), complimentaryQuota };
        });
        res.json({ success: true, data, stallArea });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.query;
        if (!isValidId(eventId)) {
            return res.status(400).json({ success: false, message: 'A valid eventId is required' });
        }
        await ensureDefaultsForEvent(eventId);
        const configs = await ExhibitorPassConfig.find({ eventId }).sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/admin/:passType', authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.query;
        if (!isValidId(eventId)) {
            return res.status(400).json({ success: false, message: 'A valid eventId is required' });
        }

        const payload = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            complimentaryQuota: Number(req.body.complimentaryQuota || 0),
            totalQuota: Number(req.body.totalQuota || 0),
            price: Number(req.body.price || 0),
            currency: req.body.currency || 'INR',
            maxPerRequest: Number(req.body.maxPerRequest || 10),
            gstPercentage: Number(req.body.gstPercentage ?? 18),
            isActive: req.body.isActive !== false,
            displayOrder: Number(req.body.displayOrder || 0),
            allocationMode: req.body.allocationMode === 'perArea' ? 'perArea' : 'fixed',
            ratioQty: Number(req.body.ratioQty || 0),
            ratioArea: Number(req.body.ratioArea || 9),
            roundingMode: ['floor', 'round', 'ceil'].includes(req.body.roundingMode) ? req.body.roundingMode : 'floor',
            validityDays: Number(req.body.validityDays || 0)
        };

        if (req.params.passType === 'vehicle' && req.body.vehicleTypeConfig) {
            const normalizeSub = (sub = {}) => ({
                allocationMode: sub.allocationMode === 'perArea' ? 'perArea' : 'fixed',
                ratioQty: Number(sub.ratioQty || 0),
                ratioArea: Number(sub.ratioArea || 9),
                roundingMode: ['floor', 'round', 'ceil'].includes(sub.roundingMode) ? sub.roundingMode : 'floor',
                complimentaryQuota: Number(sub.complimentaryQuota || 0),
                price: Number(sub.price || 0),
            });
            payload.vehicleTypeConfig = {
                twoWheeler: normalizeSub(req.body.vehicleTypeConfig.twoWheeler),
                fourWheeler: normalizeSub(req.body.vehicleTypeConfig.fourWheeler),
            };
        }

        const config = await ExhibitorPassConfig.findOneAndUpdate(
            { eventId, passType: req.params.passType },
            { $set: payload, $setOnInsert: { eventId, passType: req.params.passType } },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
