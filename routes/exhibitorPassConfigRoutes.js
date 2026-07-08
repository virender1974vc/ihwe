const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { protectExhibitor } = require('../middleware/auth');
const ExhibitorPassConfig = require('../models/ExhibitorPassConfig');
const { computeEntitlement, computeVehicleEntitlements, getExhibitorStallArea } = require('../utils/entitlementCalculator');

const router = express.Router();

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

let cleanedUpLegacyVehicleSplit = false;

const ensureDefaults = async () => {
    const count = await ExhibitorPassConfig.countDocuments();
    if (count === 0) {
        await ExhibitorPassConfig.insertMany(defaultConfigs);
        cleanedUpLegacyVehicleSplit = true;
        return;
    }
    for (const cfg of defaultConfigs) {
        await ExhibitorPassConfig.findOneAndUpdate(
            { passType: cfg.passType },
            { $setOnInsert: cfg },
            { upsert: true }
        );
    }
    // One-time cleanup: an earlier iteration briefly split "Vehicle Pass" into separate
    // vehicle_2w/vehicle_4w configs — collapse back into the single "vehicle" pass type.
    if (!cleanedUpLegacyVehicleSplit) {
        await ExhibitorPassConfig.updateOne({ passType: 'vehicle' }, { $set: { isActive: true } });
        await ExhibitorPassConfig.deleteMany({ passType: { $in: ['vehicle_2w', 'vehicle_4w'] } });
        // Backfill sensible ratio defaults onto a pre-existing "vehicle" doc whose
        // vehicleTypeConfig was never configured (still at schema defaults).
        await ExhibitorPassConfig.updateOne(
            { passType: 'vehicle', 'vehicleTypeConfig.twoWheeler.ratioQty': 0, 'vehicleTypeConfig.fourWheeler.ratioQty': 0 },
            {
                $set: {
                    'vehicleTypeConfig.twoWheeler': { allocationMode: 'perArea', ratioQty: 2, ratioArea: 9, roundingMode: 'floor', complimentaryQuota: 2, price: 300 },
                    'vehicleTypeConfig.fourWheeler': { allocationMode: 'perArea', ratioQty: 1, ratioArea: 24, roundingMode: 'floor', complimentaryQuota: 1, price: 800 },
                }
            }
        );
        cleanedUpLegacyVehicleSplit = true;
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

router.get('/my-active', protectExhibitor, async (req, res) => {
    try {
        await ensureDefaults();
        const configs = await ExhibitorPassConfig.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
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
