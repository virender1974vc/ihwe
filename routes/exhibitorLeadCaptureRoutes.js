const express = require('express');
const mongoose = require('mongoose');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorLeadCapture = require('../models/ExhibitorLeadCapture');
const BuyerRegistration = require('../models/BuyerRegistration');

const router = express.Router();

const normalizeScanPayload = (payload = {}) => {
    const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    return {
        sourceType: data.sourceType || data.type || 'unknown',
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

router.post('/resolve-scan', protectExhibitor, async (req, res) => {
    try {
        const raw = req.body?.raw || req.body?.data || req.body;
        let parsed = raw;
        if (typeof raw === 'string') {
            try {
                parsed = JSON.parse(raw);
            } catch (_) {
                parsed = { registrationId: raw };
            }
        }

        const normalized = normalizeScanPayload(parsed);
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

        if (!payload.name && !payload.company && !payload.registrationId) {
            return res.status(400).json({ success: false, message: 'Lead name, company, or registration ID is required' });
        }

        let buyer = null;
        if (req.body.linkedBuyerId && mongoose.Types.ObjectId.isValid(req.body.linkedBuyerId)) {
            buyer = await BuyerRegistration.findById(req.body.linkedBuyerId);
        }

        const lead = await ExhibitorLeadCapture.create({
            exhibitorId,
            sourceType: buyer ? 'buyer' : (payload.sourceType === 'buyer' ? 'buyer' : payload.sourceType),
            linkedBuyerId: buyer?._id || req.body.linkedBuyerId,
            ...payload,
            rawPayload: req.body.rawPayload || req.body
        });

        res.status(201).json({ success: true, data: lead });
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
