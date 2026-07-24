const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const CorporateVisitor = require('../models/visitor/CorporateVisitorModel');
const GeneralVisitor = require('../models/visitor/GeneralVisitorModel');
const FreeHealthCamp = require('../models/visitor/FreeHealthCampModel');
const GroupVisitor = require('../models/visitor/GroupVisitorModel');
const BuyerRegistration = require('../models/BuyerRegistration');
const InternationalBuyer = require('../models/InternationalBuyer');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const SellerRegistration = require('../models/SellerRegistration');
const ExhibitorPassRequest = require('../models/ExhibitorPassRequest');
const DelegateRegistration = require('../models/DelegateRegistration');
const Company = require('../models/Company');
const mongoose = require('mongoose');

const pad = (value) => String(value).padStart(2, '0');
const dayString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const normalize = (value) => String(value || '').trim();
const resolveAssetUrl = (value, requestOrigin = '') => {
    const path = normalize(value);
    if (!path || /^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    const origin = normalize(requestOrigin || process.env.BACKEND_URL || process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
    return `${origin}/${path.replace(/^\//, '')}`;
};

function extractQrData(rawValue) {
    if (rawValue && typeof rawValue === 'object') {
        return rawValue.data && typeof rawValue.data === 'object' ? rawValue.data : rawValue;
    }
    const raw = normalize(rawValue);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { /* legacy plain ID / URL */ }
    try {
        const url = new URL(raw);
        return {
            registrationId: url.searchParams.get('id') || url.searchParams.get('registrationId') || url.searchParams.get('regId')
        };
    } catch (_) { return { registrationId: raw }; }
}

function extractRegistrationId(rawValue) {
    if (rawValue && typeof rawValue === 'object') {
        const data = rawValue.data && typeof rawValue.data === 'object' ? rawValue.data : rawValue;
        return normalize(data.registrationId || data.regId || data.buyerRegistrationId || data.groupRegistrationId);
    }

    const raw = normalize(rawValue);
    if (!raw) return '';
    try {
        return extractRegistrationId(JSON.parse(raw));
    } catch (_) { /* plain text or URL */ }

    try {
        const url = new URL(raw);
        return normalize(url.searchParams.get('id') || url.searchParams.get('registrationId') || url.searchParams.get('regId'));
    } catch (_) { /* not a URL */ }

    return raw;
}

const subject = (doc, subjectType, subjectSubType, fields, requestOrigin = '') => ({
    subjectId: String(doc._id),
    subjectKey: `${subjectSubType}:${String(doc._id)}`,
    subjectType,
    subjectSubType,
    companyId: normalize(fields.companyId),
    companyRegistrationId: normalize(fields.companyRegistrationId),
    attendanceKind: normalize(fields.attendanceKind) || 'registration',
    passType: normalize(fields.passType),
    registrationId: normalize(fields.registrationId),
    name: normalize(fields.name),
    company: normalize(fields.company),
    email: normalize(fields.email),
    mobile: normalize(fields.mobile),
    country: normalize(fields.country),
    designation: normalize(fields.designation),
    photoUrl: resolveAssetUrl(fields.photoUrl, requestOrigin),
    photoKind: normalize(fields.photoKind) || 'person',
    status: normalize(fields.status),
    details: fields.details && typeof fields.details === 'object' ? fields.details : {}
});

async function resolveRegistration(rawValue, requestOrigin = '') {
    const qrData = extractQrData(rawValue);
    if (qrData.reqId && Number.isInteger(Number(qrData.index))) {
        const request = await ExhibitorPassRequest.findById(qrData.reqId).lean();
        if (!request) throw Object.assign(new Error('This pass QR is not linked to a valid pass request.'), { status: 404 });
        if (request.status !== 'approved') throw Object.assign(new Error('This pass is not approved for entry.'), { status: 403 });
        if (qrData.type && normalize(qrData.type) !== request.passType) {
            throw Object.assign(new Error('Pass QR type does not match the approved pass.'), { status: 400 });
        }
        const index = Number(qrData.index);
        const exhibitor = await ExhibitorRegistration.findById(request.exhibitorId).lean();
        if (!exhibitor) throw Object.assign(new Error('The company linked to this pass was not found.'), { status: 404 });
        const requestItems = request.passType === 'vehicle' ? request.vehicles : request.personnel;
        const isConsumablePass = ['lunch', 'water'].includes(request.passType);
        const items = requestItems?.length
            ? requestItems
            : (isConsumablePass ? [{
                _id: `${request._id}-coupon`,
                name: `${exhibitor.exhibitorName} ${request.passType === 'lunch' ? 'Food Coupon' : 'Water Pass'}`,
                designation: `${request.quantity || 1} ${request.passType === 'lunch' ? 'Packed Lunch' : 'Water'} entitlement`
            }] : []);
        const item = items[index];
        if (!item) throw Object.assign(new Error('Pass holder was not found in this pass request.'), { status: 404 });
        const isVehicle = request.passType === 'vehicle';
        const linkedTeamMember = item.teamMemberId
            ? exhibitor.teamMembers?.find(member => String(member._id) === String(item.teamMemberId))
            : null;
        const passRegistrationId = `PASS-${String(request._id)}-${index + 1}`;
        return subject({ _id: item.teamMemberId || item._id || `${request._id}-${index}` }, 'exhibitor', `${request.passType}-pass`, {
            registrationId: passRegistrationId,
            name: isVehicle ? (item.name || item.vehicleNumber || `Vehicle ${index + 1}`) : item.name,
            company: exhibitor.exhibitorName,
            companyId: exhibitor._id,
            companyRegistrationId: exhibitor.registrationId,
            email: item.email,
            mobile: item.phone,
            designation: isVehicle ? `${item.vehicleType || 'Vehicle'} • ${item.vehicleNumber || ''}` : item.designation,
            photoUrl: linkedTeamMember ? linkedTeamMember.photoUrl : item.photoUrl,
            status: request.status,
            attendanceKind: 'pass',
            passType: request.passType,
            details: {
                gender: item.gender,
                vehicleType: item.vehicleType,
                vehicleNumber: item.vehicleNumber,
                allocatedQuantity: isConsumablePass ? Number(request.quantity || 1) : 1
            }
        }, requestOrigin);
    }

    const registrationId = extractRegistrationId(rawValue);
    if (!registrationId) throw Object.assign(new Error('QR code is empty or has no registration ID.'), { status: 400 });

    let doc = await CorporateVisitor.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'visitor', 'corporate-visitor', {
        registrationId, name: `${doc.firstName || ''} ${doc.lastName || ''}`, company: doc.companyName,
        email: doc.email, mobile: doc.mobile, country: doc.country, designation: doc.designation, status: doc.status,
        details: { registrationFor: doc.registrationFor, companyWebsite: doc.companyWebsite, industrySector: doc.industrySector,
            companySize: doc.companySize, state: doc.state, city: doc.city, b2bMeeting: doc.b2bMeeting,
            purposeOfVisit: doc.purposeOfVisit, areaOfInterest: doc.areaOfInterest, specificRequirement: doc.specificRequirement }
    }, requestOrigin);

    doc = await GeneralVisitor.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'visitor', 'general-visitor', {
        registrationId, name: `${doc.firstName || ''} ${doc.lastName || ''}`, company: doc.companyName,
        email: doc.email, mobile: doc.mobile, country: doc.country, designation: doc.designation, status: doc.status,
        details: { registrationFor: doc.registrationFor, alternateNo: doc.alternateNo, dateOfBirth: doc.dateOfBirth,
            gender: doc.gender, industrySector: doc.industrySector, state: doc.state, city: doc.city,
            purposeOfVisit: doc.purposeOfVisit, areaOfInterest: doc.areaOfInterest }
    }, requestOrigin);

    doc = await FreeHealthCamp.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'visitor', 'health-camp-visitor', {
        registrationId, name: `${doc.firstName || ''} ${doc.lastName || ''}`, email: doc.email,
        mobile: doc.mobile, country: doc.country, status: doc.status,
        details: { registrationFor: doc.registrationFor, alternateNo: doc.alternateNo, dateOfBirth: doc.dateOfBirth,
            gender: doc.gender, residenceAddress: doc.residenceAddress, state: doc.state, city: doc.city,
            preferredDate: doc.preferredDate, preferredTimeSlot: doc.preferredTimeSlot, specificHealthConcerns: doc.specificHealthConcerns }
    }, requestOrigin);

    const group = await GroupVisitor.findOne({
        $or: [{ groupRegistrationId: registrationId }, { 'persons.registrationId': registrationId }]
    }).lean();
    if (group) {
        const member = (group.persons || []).find((item) => item.registrationId === registrationId);
        const item = member || group.persons?.[0] || {};
        return subject({ _id: member?._id || group._id }, 'visitor', member ? 'group-visitor-member' : 'group-visitor', {
            registrationId, name: `${item.firstName || group.primaryFirstName || ''} ${item.lastName || group.primaryLastName || ''}`,
            company: group.companyName, email: item.email || group.primaryEmail,
            mobile: item.mobileNo || group.primaryMobile, country: group.country, designation: item.designation, status: group.status,
            details: { registrationFor: group.registrationFor, gender: item.gender, companyWebsite: group.companyWebsite,
                industrySector: group.industrySector, companySize: group.companySize, state: group.state, city: group.city,
                groupSize: group.persons?.length, purposeOfVisit: group.purposeOfVisit, areaOfInterest: group.areaOfInterest }
        }, requestOrigin);
    }

    doc = await BuyerRegistration.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'buyer', 'buyer', {
        registrationId, name: doc.fullName || doc.contactPerson, company: doc.companyName || doc.companyFirmName,
        email: doc.emailAddress, mobile: doc.mobileNumber, country: doc.country, designation: doc.designation, status: doc.paymentStatus,
        details: { alternateNumber: doc.alternateNumber, website: doc.website, registeredAddress: doc.registeredAddress,
            state: doc.stateProvince, city: doc.city, pinCode: doc.pinCode, businessType: doc.businessType,
            natureOfBusiness: doc.natureOfBusiness, buyerIndustry: doc.buyerIndustry, annualTurnover: doc.annualTurnover,
            primaryProductInterest: doc.primaryProductInterest, secondaryProductCategories: doc.secondaryProductCategories,
            purchaseTimeline: doc.purchaseTimeline, roleInPurchaseDecision: doc.roleInPurchaseDecision,
            registrationCategory: doc.registrationCategory, buyerTag: doc.buyerTag, b2bMeetInterest: doc.b2bMeetInterest }
    }, requestOrigin);

    doc = await InternationalBuyer.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'buyer', 'international-buyer', {
        registrationId, name: doc.primaryContact?.fullName, company: doc.brandName || doc.companyName,
        email: doc.primaryContact?.emailId, mobile: doc.primaryContact?.mobileNumber,
        country: doc.country, designation: doc.primaryContact?.designation,
        status: doc.verification?.adminApprovalStatus || 'Pending'
        , photoUrl: doc.primaryContact?.photoUrl || doc.documents?.logo,
        details: { legalEntityType: doc.legalEntityType, countryOfRegistration: doc.countryOfRegistration,
            yearOfEstablishment: doc.yearOfEstablishment, natureOfBusiness: doc.natureOfBusiness,
            address: doc.address, state: doc.stateProvince, city: doc.city, postalCode: doc.postalCode,
            website: doc.website, whatsappNumber: doc.primaryContact?.whatsappNumber,
            productCategories: doc.productCategories, b2bInterest: doc.b2bInterest?.interested }
    }, requestOrigin);

    doc = await ExhibitorRegistration.findOne({ registrationId }).lean();
    if (doc) {
        let linkedCompany = doc.clientId && mongoose.Types.ObjectId.isValid(String(doc.clientId))
            ? await Company.findById(doc.clientId).select('companyLogo').lean()
            : null;
        if (!linkedCompany) {
            linkedCompany = await Company.findOne({
                $or: [
                    { exhibitorRegistrationId: String(doc._id) },
                    { companyName: doc.exhibitorName }
                ]
            }).select('companyLogo').lean();
        }
        return subject(doc, 'exhibitor', 'exhibitor', {
        registrationId, name: doc.exhibitorName,
        company: doc.exhibitorName, companyId: doc._id, email: doc.contact1?.email, mobile: doc.contact1?.mobile,
        country: doc.country, designation: doc.contact1?.designation, status: doc.status
        , photoUrl: doc.companyLogoUrl || doc.companyLogo || linkedCompany?.companyLogo,
        photoKind: 'logo'
        }, requestOrigin);
    }

    doc = await SellerRegistration.findOne({ registrationId }).lean();
    if (doc) return subject(doc, 'exhibitor', 'seller', {
        registrationId, name: doc.fullName || doc.contactPerson, company: doc.companyName,
        email: doc.emailAddress, mobile: doc.mobileNumber, country: doc.country, designation: doc.designation, status: doc.paymentStatus,
        details: { alternateNumber: doc.alternateNumber, website: doc.website, registeredAddress: doc.registeredAddress,
            state: doc.stateProvince, city: doc.city, pinCode: doc.pinCode, businessType: doc.businessType,
            natureOfBusiness: doc.natureOfBusiness, annualTurnover: doc.annualTurnover,
            primaryProductCategory: doc.primaryProductCategory, secondaryProductCategories: doc.secondaryProductCategories,
            targetMarket: doc.targetMarket, registrationCategory: doc.registrationCategory, sellerTag: doc.sellerTag }
    }, requestOrigin);

    doc = await DelegateRegistration.findOne({ regNo: registrationId }).lean();
    if (doc) {
        const exhibitor = doc.exhibitorId ? await ExhibitorRegistration.findById(doc.exhibitorId).lean() : null;
        return subject(doc, exhibitor ? 'exhibitor' : 'visitor', 'delegate-pass', {
            registrationId: doc.regNo,
            name: doc.fullName,
            company: exhibitor?.exhibitorName || doc.exhibitorCompanyName || doc.organization,
            companyId: exhibitor?._id || '', email: doc.email, mobile: doc.mobile,
            country: doc.country, designation: doc.designation, photoUrl: doc.profileImage,
            status: doc.paymentStatus, attendanceKind: 'pass', passType: 'delegate',
            details: { title: doc.title, alternateMobile: doc.alternateMobile, address: doc.address,
                state: doc.state, city: doc.city, pincode: doc.pincode, industrySector: doc.industrySector,
                typeOfBusiness: doc.typeOfBusiness, registrationSource: doc.registrationSource,
                sessions: (doc.sessions || []).map(item => item.title).filter(Boolean),
                specialPasses: (doc.specialPasses || []).map(item => item.title).filter(Boolean) }
        }, requestOrigin);
    }

    throw Object.assign(new Error(`No visitor, buyer or exhibitor found for ${registrationId}.`), { status: 404 });
}

async function getEventContext() {
    // Attendance always follows the first event shown in Admin > Events.
    // Sequence / Order = 1 is authoritative, regardless of active/inactive status.
    // The sorted fallback only protects older databases where order was never set.
    let event = await Event.findOne({ order: 1 }).sort({ startDate: -1, createdAt: 1 }).lean();
    if (!event) {
        event = await Event.findOne().sort({ order: 1, startDate: -1, createdAt: 1 }).lean();
    }
    const fallbackStart = new Date('2026-08-21T00:00:00+05:30');
    const start = event?.startDate ? new Date(event.startDate) : fallbackStart;
    const end = event?.endDate ? new Date(event.endDate) : new Date('2026-08-23T00:00:00+05:30');
    const days = [];
    for (const cursor = new Date(start); cursor <= end && days.length < 31; cursor.setDate(cursor.getDate() + 1)) {
        days.push(dayString(cursor));
    }
    return {
        event: event ? {
            _id: event._id,
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            status: event.status,
            order: event.order,
            ticketsStatus: event.ticketsStatus,
            speakersCount: event.speakersCount,
            description: event.description,
            contactPhone: event.contactPhone,
            paymentPlans: event.paymentPlans || [],
            generalReminderDays: event.generalReminderDays,
            installmentReminderDays: event.installmentReminderDays
        } : null,
        eventId: event?._id || null,
        days: days.length ? days : ['2026-08-21', '2026-08-22', '2026-08-23']
    };
}

async function registeredTotals() {
    const [corporate, general, health, groups, buyers, internationalBuyers, exhibitors, sellers] = await Promise.all([
        CorporateVisitor.countDocuments(), GeneralVisitor.countDocuments(), FreeHealthCamp.countDocuments(),
        GroupVisitor.aggregate([{ $project: { count: { $size: { $ifNull: ['$persons', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
        BuyerRegistration.countDocuments(), InternationalBuyer.countDocuments(),
        ExhibitorRegistration.countDocuments(), SellerRegistration.countDocuments()
    ]);
    const bySubType = {
        'general-visitor': general,
        'corporate-visitor': corporate,
        'group-visitor-member': groups[0]?.total || 0,
        'health-camp-visitor': health,
        buyer: buyers,
        'international-buyer': internationalBuyers,
        exhibitor: exhibitors,
        seller: sellers
    };
    return {
        visitor: corporate + general + health + (groups[0]?.total || 0),
        buyer: buyers + internationalBuyers,
        exhibitor: exhibitors + sellers,
        bySubType
    };
}

module.exports = { extractQrData, extractRegistrationId, resolveRegistration, getEventContext, registeredTotals };
