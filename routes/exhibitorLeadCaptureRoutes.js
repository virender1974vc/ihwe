const express = require('express');
const mongoose = require('mongoose');
const { protectExhibitor } = require('../middleware/auth');
const { authMiddleware } = require('../middleware/authMiddleware');
const ExhibitorLeadCapture = require('../models/ExhibitorLeadCapture');
const BuyerRegistration = require('../models/BuyerRegistration');
const InternationalBuyer = require('../models/InternationalBuyer');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const ExhibitorPassRequest = require('../models/ExhibitorPassRequest');
const Stall = require('../models/Stall');
const CorporateVisitorModel = require('../models/visitor/CorporateVisitorModel');
const GeneralVisitorModel = require('../models/visitor/GeneralVisitorModel');
const FreeHealthCampModel = require('../models/visitor/FreeHealthCampModel');

const router = express.Router();

const normalizeSourceType = (value) => {
    const sourceType = String(value || '').toLowerCase();
    return ['buyer', 'visitor', 'exhibitor', 'exhibitor_pass', 'unknown'].includes(sourceType) ? sourceType : 'unknown';
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
    const requestedPassId = data.reqId || data.requestId || '';
    const requestedPassIndex = Number.isInteger(Number(data.index))
        ? Number(data.index) + 1
        : 1;
    return {
        sourceType: normalizeSourceType(data.sourceType || data.type),
        registrationId: data.registrationId
            || data.regId
            || data.buyerRegistrationId
            || (requestedPassId ? `PASS-${requestedPassId}-${requestedPassIndex}` : ''),
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
        let visitor = null;

        const lookupConditions = [
            normalized.registrationId ? { registrationId: normalized.registrationId } : null,
            normalized.email ? { emailAddress: normalized.email.toLowerCase() } : null,
            normalized.phone ? { mobileNumber: normalized.phone } : null
        ].filter(Boolean);

        const visitorLookupConditions = [
            normalized.registrationId ? { registrationId: normalized.registrationId } : null,
            normalized.email ? { email: normalized.email.toLowerCase() } : null,
            normalized.phone ? { mobile: normalized.phone } : null
        ].filter(Boolean);

        if (lookupConditions.length > 0) {
            buyer = await BuyerRegistration.findOne({ $or: lookupConditions })
                .select('companyName companyFirmName fullName designation mobileNumber emailAddress country primaryProductInterest registrationId');
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
                    buyerKind: 'domestic',
                    profileDetails: {
                        businessType: buyer.businessType || buyer.basicBusinessType || '',
                        brandName: buyer.brandName || '',
                        address: buyer.registeredAddress || '',
                        city: buyer.city || '',
                        state: buyer.stateProvince || '',
                        website: buyer.website || '',
                        annualTurnover: buyer.annualTurnover || '',
                        purchaseVolume: buyer.estimatedPurchaseVolume || '',
                        budgetRange: buyer.budgetRange || '',
                        purchaseTimeline: buyer.purchaseTimeline || '',
                        secondaryInterests: buyer.secondaryProductCategories || [],
                        meetingInterest: buyer.b2bMeetInterest || buyer.matchmakingInterest || ''
                    },
                    rawPayload: parsed
                }
            });
        }

        const internationalConditions = [
            normalized.registrationId ? { registrationId: normalized.registrationId } : null,
            normalized.email ? { 'primaryContact.emailId': normalized.email.toLowerCase() } : null,
            normalized.phone ? { 'primaryContact.mobileNumber': normalized.phone } : null
        ].filter(Boolean);
        const internationalBuyer = internationalConditions.length
            ? await InternationalBuyer.findOne({ $or: internationalConditions }).lean()
            : null;

        if (internationalBuyer) {
            return res.json({
                success: true,
                data: {
                    sourceType: 'buyer',
                    linkedBuyerId: internationalBuyer._id,
                    registrationId: internationalBuyer.registrationId,
                    name: internationalBuyer.primaryContact?.fullName || internationalBuyer.brandName,
                    company: internationalBuyer.brandName,
                    designation: internationalBuyer.primaryContact?.designation || '',
                    phone: internationalBuyer.primaryContact?.mobileNumber || '',
                    email: internationalBuyer.primaryContact?.emailId || '',
                    country: internationalBuyer.country || internationalBuyer.countryOfRegistration || '',
                    interest: (internationalBuyer.productCategories || []).join(', '),
                    buyerKind: 'international',
                    profileDetails: {
                        legalEntityType: internationalBuyer.legalEntityType || '',
                        natureOfBusiness: internationalBuyer.natureOfBusiness || [],
                        address: internationalBuyer.address || '',
                        city: internationalBuyer.city || '',
                        state: internationalBuyer.stateProvince || '',
                        postalCode: internationalBuyer.postalCode || '',
                        website: internationalBuyer.website || '',
                        keyProductsServices: internationalBuyer.businessProfile?.keyProductsServices || '',
                        lookingFor: internationalBuyer.b2bInterest?.lookingFor || [],
                        meetingInterest: internationalBuyer.b2bInterest?.interested || ''
                    },
                    rawPayload: parsed
                }
            });
        }

        const passMatch = String(normalized.registrationId || '').match(/^PASS-([a-f\d]{24})-(\d+)$/i);
        if (passMatch) {
            const request = await ExhibitorPassRequest.findById(passMatch[1])
                .populate('exhibitorId')
                .lean();
            const holders = request?.passType === 'vehicle' ? request?.vehicles : request?.personnel;
            const holderIndex = Number(passMatch[2]) - 1;
            const isValidPassIndex = request
                && holderIndex >= 0
                && holderIndex < Math.max(Number(request.quantity || 1), holders?.length || 0);
            const holder = holders?.[holderIndex] || {};
            if (isValidPassIndex) {
                const exhibitor = request.exhibitorId || {};
                const bookedStall = await Stall.findOne({ bookedBy: exhibitor._id })
                    .select('stallNumber')
                    .lean();
                return res.json({
                    success: true,
                    data: {
                        sourceType: 'exhibitor_pass',
                        registrationId: normalized.registrationId,
                        name: holder.name || holder.vehicleNumber || exhibitor.exhibitorName || `${request.passType} pass`,
                        company: exhibitor.exhibitorName || '',
                        designation: holder.designation || holder.vehicleType || '',
                        phone: holder.phone || '',
                        email: holder.email || '',
                        country: exhibitor.country || '',
                        interest: exhibitor.industrySector || exhibitor.primaryCategory || '',
                        profileDetails: {
                            passType: request.passType,
                            passStatus: request.status,
                            paymentStatus: request.paymentStatus,
                            vehicleNumber: holder.vehicleNumber || '',
                            gender: holder.gender || '',
                            stallNumber: bookedStall?.stallNumber || exhibitor.participation?.stallNo || '',
                            exhibitorRegistrationId: exhibitor.registrationId || ''
                        },
                        rawPayload: parsed
                    }
                });
            }
        }

        const exhibitorConditions = [
            normalized.registrationId ? { registrationId: normalized.registrationId } : null,
            normalized.email ? { $or: [{ companyEmail: normalized.email.toLowerCase() }, { 'contact1.email': normalized.email.toLowerCase() }] } : null,
            normalized.phone ? { 'contact1.mobile': normalized.phone } : null
        ].filter(Boolean);
        const exhibitor = exhibitorConditions.length
            ? await ExhibitorRegistration.findOne({ $or: exhibitorConditions }).lean()
            : null;
        if (exhibitor) {
            const bookedStall = await Stall.findOne({ bookedBy: exhibitor._id })
                .select('stallNumber')
                .lean();
            return res.json({
                success: true,
                data: {
                    sourceType: 'exhibitor',
                    registrationId: exhibitor.registrationId,
                    name: `${exhibitor.contact1?.firstName || ''} ${exhibitor.contact1?.lastName || ''}`.trim(),
                    company: exhibitor.exhibitorName,
                    designation: exhibitor.contact1?.designation || '',
                    phone: exhibitor.contact1?.mobile || '',
                    email: exhibitor.contact1?.email || exhibitor.companyEmail || '',
                    country: exhibitor.country || '',
                    interest: exhibitor.industrySector || exhibitor.primaryCategory || '',
                    profileDetails: {
                        address: exhibitor.address || '',
                        city: exhibitor.city || '',
                        state: exhibitor.state || '',
                        website: exhibitor.website || '',
                        stallNumber: bookedStall?.stallNumber || exhibitor.participation?.stallNo || '',
                        stallSize: exhibitor.participation?.stallSize || '',
                        stallType: exhibitor.participation?.stallType || '',
                        category: exhibitor.primaryCategory || exhibitor.subCategory || '',
                        status: exhibitor.status || ''
                    },
                    rawPayload: parsed
                }
            });
        }

        if (visitorLookupConditions.length > 0) {
            visitor = await CorporateVisitorModel.findOne({ $or: visitorLookupConditions })
                .select('companyName firstName lastName designation mobile email country areaOfInterest registrationId');

            if (!visitor) {
                visitor = await GeneralVisitorModel.findOne({ $or: visitorLookupConditions })
                    .select('companyName firstName lastName designation mobile email country areaOfInterest registrationId');
            }

            if (!visitor) {
                visitor = await FreeHealthCampModel.findOne({ $or: visitorLookupConditions })
                    .select('firstName lastName mobile email country specificHealthConcerns registrationId');
            }
        }

        if (visitor) {
            const visitorName = `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim();
            return res.json({
                success: true,
                data: {
                    sourceType: 'visitor',
                    linkedBuyerId: visitor._id,
                    registrationId: visitor.registrationId,
                    name: visitorName,
                    company: visitor.companyName || '',
                    designation: visitor.designation || '',
                    phone: visitor.mobile || '',
                    email: visitor.email || '',
                    country: visitor.country || '',
                    interest: (visitor.areaOfInterest && visitor.areaOfInterest.length > 0) ? visitor.areaOfInterest.join(', ') : (visitor.specificHealthConcerns || ''),
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
            buyerKind: ['domestic', 'international'].includes(req.body.buyerKind) ? req.body.buyerKind : '',
            profileDetails: req.body.profileDetails && typeof req.body.profileDetails === 'object'
                ? req.body.profileDetails
                : {},
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
        const leads = await ExhibitorLeadCapture.find({
            exhibitorId: req.user.id,
            sourceType: { $in: ['buyer', 'visitor'] }
        }).sort({ createdAt: -1 });
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
