const express = require('express');
const mongoose = require('mongoose');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorLeadCapture = require('../models/ExhibitorLeadCapture');
const BuyerRegistration = require('../models/BuyerRegistration');

const router = express.Router();

const normalizeSourceType = (value) => {
    const sourceType = String(value || '').toLowerCase();
    return ['buyer', 'visitor', 'unknown'].includes(sourceType) ? sourceType : 'unknown';
};

const isPlainRegistrationCode = (value) => /^[a-zA-Z0-9_-]{4,60}$/.test(String(value || '').trim());

const parseScanPayload = (raw) => {
    if (!raw) {
        return { error: 'Empty QR code. Please scan a valid IHWE buyer/visitor QR.' };
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) {
            return { error: 'Empty QR code. Please scan a valid IHWE buyer/visitor QR.' };
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return { error: 'Invalid QR format. QR JSON must be an object.' };
            }
            return { parsed };
        } catch (_) {
            if (isPlainRegistrationCode(trimmed)) {
                return { parsed: { registrationId: trimmed } };
            }
            return {
                error: 'Invalid QR format. Expected IHWE QR JSON with sourceType, registrationId, name, company, phone, email, or a registration code.'
            };
        }
    }

    if (typeof raw === 'object' && !Array.isArray(raw)) {
        return { parsed: raw };
    }

    return { error: 'Invalid QR format. Please scan a valid IHWE buyer/visitor QR.' };
};

const normalizeScanPayload = (payload = {}) => {
    const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    return {
        sourceType: normalizeSourceType(data.sourceType || data.type),
        registrationId: data.registrationId || data.regId || data.buyerRegistrationId || '',
        name: data.name || data.fullName || data.visitorName || data.contactName || '',
        company: data.company || data.companyName || data.companyFirmName || '',
        designation: data.designation || data.role || '',
        phone: data.phone || data.mobile || data.mobileNumber || data.contactNumber || '',
        email: data.email || data.emailAddress || '',
        country: data.country || '',
        interest: data.interest || data.primaryProductInterest || data.productInterest || '',
        notes: data.notes || data.remarks || ''
    };
};

const validateResolvedPayload = (payload) => {
    const hasIdentifier = Boolean(payload.registrationId || payload.email || payload.phone);
    const hasDisplayDetails = Boolean(payload.name || payload.company);

    if (payload.sourceType === 'unknown' && !hasIdentifier) {
        return 'QR must include sourceType as buyer/visitor, or a valid registrationId/email/phone.';
    }

    if (!hasIdentifier && !hasDisplayDetails) {
        return 'QR must include at least one lead identifier: registrationId, email, phone, name, or company.';
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        return 'QR email is invalid.';
    }

    return '';
};

router.post('/resolve-scan', protectExhibitor, async (req, res) => {
    try {
        const raw = req.body?.raw || req.body?.data || req.body;
        const { parsed, error } = parseScanPayload(raw);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        const normalized = normalizeScanPayload(parsed);
        const validationError = validateResolvedPayload(normalized);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        let buyer = null;
        if (normalized.registrationId || normalized.email || normalized.phone) {
            buyer = await BuyerRegistration.findOne({
                $or: [
                    normalized.registrationId ? { registrationId: normalized.registrationId } : null,
                    normalized.email ? { emailAddress: normalized.email.toLowerCase() } : null,
                    normalized.phone ? { mobileNumber: normalized.phone } : null
                ].filter(Boolean)
            }).select('companyName companyFirmName fullName designation mobileNumber emailAddress country primaryProductInterest registrationId');
        }

        if (buyer) {
            return res.json({
                success: true,
                data: {
                    sourceType: 'buyer',
                    linkedBuyerId: buyer._id,
                    registrationId: buyer.registrationId,
                    name: buyer.fullName || buyer.companyName || buyer.companyFirmName,
                    company: buyer.companyName || buyer.companyFirmName,
                    designation: buyer.designation || '',
                    phone: buyer.mobileNumber || '',
                    email: buyer.emailAddress || '',
                    country: buyer.country || '',
                    interest: buyer.primaryProductInterest || '',
                    rawPayload: parsed
                }
            });
        }

        res.json({ success: true, data: { ...normalized, rawPayload: parsed } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', protectExhibitor, async (req, res) => {
    try {
        const payload = normalizeScanPayload(req.body);
        const exhibitorId = req.user.id;
        const validationError = validateResolvedPayload(payload);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        if (!payload.name && !payload.company && !payload.registrationId) {
            return res.status(400).json({ success: false, message: 'Lead name, company, or registration ID is required' });
        }

        let buyer = null;
        if (req.body.linkedBuyerId && mongoose.Types.ObjectId.isValid(req.body.linkedBuyerId)) {
            buyer = await BuyerRegistration.findById(req.body.linkedBuyerId);
        }

        const uniqueConditions = [
            buyer?._id ? { linkedBuyerId: buyer._id } : null,
            req.body.linkedBuyerId && mongoose.Types.ObjectId.isValid(req.body.linkedBuyerId) ? { linkedBuyerId: req.body.linkedBuyerId } : null,
            payload.registrationId ? { registrationId: payload.registrationId } : null,
            payload.email ? { email: payload.email.toLowerCase() } : null,
            payload.phone ? { phone: payload.phone } : null
        ].filter(Boolean);

        const linkedBuyerId = buyer?._id || (
            req.body.linkedBuyerId && mongoose.Types.ObjectId.isValid(req.body.linkedBuyerId)
                ? req.body.linkedBuyerId
                : undefined
        );

        const leadData = {
            exhibitorId,
            sourceType: buyer ? 'buyer' : (payload.sourceType === 'buyer' ? 'buyer' : payload.sourceType),
            linkedBuyerId,
            ...payload,
            rawPayload: req.body.rawPayload || req.body
        };

        let lead;
        let statusCode = 201;
        if (uniqueConditions.length > 0) {
            lead = await ExhibitorLeadCapture.findOneAndUpdate(
                { exhibitorId, $or: uniqueConditions },
                { $set: leadData, $setOnInsert: { scannedAt: new Date() } },
                { upsert: true, returnDocument: 'after', runValidators: true }
            );
            statusCode = 200;
        } else {
            lead = await ExhibitorLeadCapture.create(leadData);
        }

        res.status(statusCode).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/my', protectExhibitor, async (req, res) => {
    try {
        const leads = await ExhibitorLeadCapture.find({ exhibitorId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.put('/:id', protectExhibitor, async (req, res) => {
    try {
        const { temperature, notes } = req.body;
        const lead = await ExhibitorLeadCapture.findOneAndUpdate(
            { _id: req.params.id, exhibitorId: req.user.id },
            { $set: { ...(temperature && { temperature }), ...(notes !== undefined && { notes }) } },
            { returnDocument: 'after' }
        );

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });
        }

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/all', authMiddleware, async (_req, res) => {
    try {
        const leads = await ExhibitorLeadCapture.find()
            .populate('exhibitorId', 'exhibitorName registrationId participation')
            .populate('linkedBuyerId', 'companyName registrationId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
