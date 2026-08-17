const express = require('express');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorPassRequest = require('../models/ExhibitorPassRequest');
const DelegateRegistration = require('../models/DelegateRegistration');
const Attendance = require('../models/Attendance');
const ExhibitorPassConfig = require('../models/ExhibitorPassConfig');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const { computeEntitlement, computeVehicleEntitlements, getExhibitorStallArea } = require('../utils/entitlementCalculator');
const { signPassQr } = require('../utils/passQrToken');

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
        const securedPassRequests = passRequests.map(request => ({
            ...request,
            qrPayloads: Array.from(
                { length: ['lunch', 'water'].includes(request.passType) ? 1 : Number(request.quantity || 1) },
                (_, index) => signPassQr({
                    reqId: request._id,
                    type: request.passType,
                    index,
                    version: request.qrVersion || 1
                })
            )
        }));
        const requests = [...securedPassRequests, ...delegateRequests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
            {
                status,
                ...(status === 'rejected'
                    ? { revokedAt: new Date(), revokedBy: req.user.id, revocationReason: String(req.body.reason || 'Pass request rejected') }
                    : {})
            },
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

router.post('/admin/:id/reissue', authMiddleware, async (req, res) => {
    try {
        const request = await ExhibitorPassRequest.findByIdAndUpdate(
            req.params.id,
            {
                $inc: { qrVersion: 1 },
                $set: { revokedAt: null, revokedBy: null, revocationReason: '', status: 'approved' }
            },
            { returnDocument: 'after' }
        );
        if (!request) return res.status(404).json({ success: false, message: 'Pass request not found' });
        res.json({ success: true, message: 'New QR issued. All older QR copies are invalid.', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/admin/:id/revoke', authMiddleware, async (req, res) => {
    try {
        const reason = String(req.body.reason || '').trim();
        if (!reason) return res.status(400).json({ success: false, message: 'Revocation reason is required' });
        const request = await ExhibitorPassRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    revokedAt: new Date(),
                    revokedBy: req.user.id,
                    revocationReason: reason
                }
            },
            { returnDocument: 'after' }
        );
        if (!request) return res.status(404).json({ success: false, message: 'Pass request not found' });
        res.json({ success: true, message: 'Pass QR revoked.', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/wallet/my', protectExhibitor, async (req, res) => {
    try {
        const exhibitorId = req.user.id;
        const exhibitorReg = await ExhibitorRegistration.findById(exhibitorId).select('eventId').lean();
        const [requests, allRequests, delegates, usageRecords, configs, stallArea] = await Promise.all([
            ExhibitorPassRequest.find({ exhibitorId, status: 'approved', revokedAt: null }).sort({ createdAt: -1 }).lean(),
            ExhibitorPassRequest.find({ exhibitorId }).select('passType quantity status vehicles paymentStatus').lean(),
            DelegateRegistration.find({
                exhibitorId,
                registrationSource: 'exhibitor',
                paymentStatus: { $in: ['paid', 'free'] }
            }).sort({ createdAt: -1 }).lean(),
            Attendance.find({ companyId: String(exhibitorId) })
                .select('registrationId eventDay markedAt deliveredQuantity allocatedQuantity deliveryHistory')
                .sort({ markedAt: -1 })
                .lean(),
            ExhibitorPassConfig.find({ eventId: exhibitorReg?.eventId, isActive: true }).lean(),
            getExhibitorStallArea(exhibitorId)
        ]);
        const validityByType = new Map(configs.map(config => [
            config.passType,
            Math.max(0, Number(config.validityDays || 0))
        ]));
        const passSummary = configs.map(config => {
            const relevant = allRequests.filter(request =>
                request.passType === config.passType && request.status !== 'rejected');
            const claimed = relevant.reduce((sum, request) => sum + Number(request.quantity || 0), 0);
            const approved = relevant.filter(request => request.status === 'approved')
                .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
            const pending = relevant.filter(request => request.status === 'pending')
                .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
            if (config.passType === 'vehicle') {
                const entitlement = computeVehicleEntitlements(config, stallArea);
                let claimedTwoWheeler = 0;
                let claimedFourWheeler = 0;
                relevant.forEach(request => (request.vehicles || []).forEach(vehicle => {
                    if (vehicle.vehicleType === '2-wheeler') claimedTwoWheeler += 1;
                    else claimedFourWheeler += 1;
                }));
                return {
                    passType: config.passType,
                    title: config.title,
                    complimentaryTotal: entitlement.twoWheeler + entitlement.fourWheeler,
                    complimentaryClaimed: Math.min(entitlement.twoWheeler, claimedTwoWheeler)
                        + Math.min(entitlement.fourWheeler, claimedFourWheeler),
                    complimentaryRemaining: Math.max(0, entitlement.twoWheeler - claimedTwoWheeler)
                        + Math.max(0, entitlement.fourWheeler - claimedFourWheeler),
                    claimed,
                    approved,
                    pending,
                    totalQuota: Number(config.totalQuota || 0),
                    vehicle: {
                        twoWheeler: {
                            total: entitlement.twoWheeler,
                            claimed: claimedTwoWheeler,
                            remaining: Math.max(0, entitlement.twoWheeler - claimedTwoWheeler)
                        },
                        fourWheeler: {
                            total: entitlement.fourWheeler,
                            claimed: claimedFourWheeler,
                            remaining: Math.max(0, entitlement.fourWheeler - claimedFourWheeler)
                        }
                    }
                };
            }
            const complimentaryTotal = computeEntitlement({
                allocationMode: config.allocationMode,
                ratioQty: config.ratioQty,
                ratioArea: config.ratioArea,
                roundingMode: config.roundingMode,
                fixedQty: config.complimentaryQuota
            }, stallArea);
            return {
                passType: config.passType,
                title: config.title,
                complimentaryTotal,
                complimentaryClaimed: Math.min(complimentaryTotal, claimed),
                complimentaryRemaining: Math.max(0, complimentaryTotal - claimed),
                claimed,
                approved,
                pending,
                totalQuota: Number(config.totalQuota || 0)
            };
        });
        const usageByRegistration = usageRecords.reduce((map, usage) => {
            const key = String(usage.registrationId || '');
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(usage);
            return map;
        }, new Map());
        const passes = requests.flatMap(request => {
            const isVehicle = request.passType === 'vehicle';
            const isConsumable = ['lunch', 'water'].includes(request.passType);
            const entries = isVehicle ? request.vehicles : request.personnel;
            const holders = isConsumable
                ? [{}]
                : entries?.length
                    ? entries
                    : Array.from({ length: Number(request.quantity || 1) }, () => ({}));
            return holders.map((holder, index) => {
                const registrationId = `PASS-${String(request._id)}-${index + 1}`;
                const usage = usageByRegistration.get(registrationId) || [];
                const deliveredQuantity = isConsumable
                    ? Math.max(0, ...usage.map(item => Number(item.deliveredQuantity || 0)))
                    : usage.length;
                return {
                id: `${request._id}-${index}`,
                requestId: request._id,
                registrationId,
                passType: request.passType,
                validityDays: validityByType.get(request.passType) || 0,
                status: request.status,
                paymentStatus: request.paymentStatus,
                quantity: isConsumable ? Number(request.quantity || 1) : 1,
                holderIndex: index,
                name: holder.name || holder.vehicleNumber || '',
                designation: holder.designation || holder.vehicleType || '',
                vehicleNumber: holder.vehicleNumber || '',
                used: usage.length > 0,
                deliveredQuantity,
                remainingQuantity: isConsumable
                    ? Math.max(0, Number(request.quantity || 1) - deliveredQuantity)
                    : Math.max(0, 1 - Math.min(1, usage.length)),
                dayUsage: usage.map(item => ({
                    day: item.eventDay,
                    usedAt: item.markedAt,
                    deliveredQuantity: Number(item.deliveredQuantity || 0)
                })),
                qrValue: signPassQr({
                    reqId: request._id,
                    type: request.passType,
                    index,
                    version: request.qrVersion || 1
                })
            };
            });
        });
        delegates.forEach(delegate => {
            const usage = usageByRegistration.get(String(delegate.regNo || '')) || [];
            passes.push({
            id: `delegate-${delegate._id}`,
            requestId: delegate._id,
            passType: 'delegate',
            status: 'approved',
            paymentStatus: delegate.paymentStatus,
            quantity: 1,
            used: usage.length > 0,
            remainingQuantity: usage.length ? 0 : 1,
            dayUsage: usage.map(item => ({ day: item.eventDay, usedAt: item.markedAt })),
            name: delegate.fullName,
            designation: delegate.designation || '',
            qrValue: delegate.regNo
        });
        });
        res.json({ success: true, data: passes, summary: passSummary, stallArea });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
