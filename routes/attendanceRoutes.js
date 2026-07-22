const express = require('express');
const Attendance = require('../models/Attendance');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Company = require('../models/Company');
const Stall = require('../models/Stall');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/authMiddleware');
const { resolveRegistration, getEventContext, registeredTotals } = require('../services/attendanceService');
const { createAttendanceWorkbook } = require('../services/attendanceExportService');
const aiService = require('../services/aiDocumentVerificationService');
const { getDirectory, registeredRows } = require('../services/attendanceDirectoryService');
const AttendanceAudit = require('../models/AttendanceAudit');
const AttendanceScanAttempt = require('../models/AttendanceScanAttempt');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const BuyerRegistration = require('../models/BuyerRegistration');
const InternationalBuyer = require('../models/InternationalBuyer');
const StallProduct = require('../models/StallProduct');
const StallAccessory = require('../models/StallAccessory');
const AccessoryOrder = require('../models/AccessoryOrder');
const { computeEntitlement, getExhibitorStallArea } = require('../utils/entitlementCalculator');

const router = express.Router();
router.use(authMiddleware);

const asyncRoute = (handler) => async (req, res) => {
    try { await handler(req, res); }
    catch (error) { res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' }); }
};
const requestOrigin = (req) => `${String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0]}://${req.get('host')}`;
const normalizedRole = role => String(role || '').toLowerCase().replace(/[–—]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isSuperAdmin = req => ['super-admin', 'super-administrator', 'ihwe-super-administrator'].includes(normalizedRole(req.user?.role));

async function companyAttendanceSummary(eventId, eventDay) {
    const attendanceMatch = { eventId, subjectType: 'exhibitor', ...(eventDay ? { eventDay } : {}) };
    const rows = await Attendance.find(attendanceMatch)
        .select('companyId registrationId attendanceKind subjectKey markedAt')
        .lean();
    const mainRows = rows.filter(row => row.attendanceKind !== 'pass');
    const companyIds = [...new Set(mainRows.map(row => String(row.companyId || ''))
        .filter(id => mongoose.Types.ObjectId.isValid(id)))];
    const registrationIds = [...new Set(mainRows.map(row => String(row.registrationId || '').trim()).filter(Boolean))];
    if (!companyIds.length && !registrationIds.length) return [];
    const registrations = await ExhibitorRegistration.find({
        $or: [
            ...(companyIds.length ? [{ _id: { $in: companyIds } }] : []),
            ...(registrationIds.length ? [{ registrationId: { $in: registrationIds } }] : [])
        ]
    }).select('_id exhibitorName registrationId status').lean();
    const statsByCompany = new Map();
    for (const registration of registrations) {
        const related = rows.filter(row =>
            String(row.companyId || '') === String(registration._id)
            || String(row.registrationId || '') === String(registration.registrationId || ''));
        const passPeople = new Set(related.filter(row => row.attendanceKind === 'pass').map(row => row.subjectKey));
        const lastCheckIn = related.reduce((latest, row) =>
            !latest || new Date(row.markedAt) > new Date(latest) ? row.markedAt : latest, null);
        statsByCompany.set(String(registration._id), {
            companyAttendance: related.some(row => row.attendanceKind !== 'pass') ? 1 : 0,
            totalPeople: new Set(related.map(row => row.subjectKey)).size,
            passPeople: passPeople.size,
            lastCheckIn
        });
    }
    return registrations.map(registration => {
        const stats = statsByCompany.get(String(registration._id)) || {};
        return {
            companyId: String(registration._id),
            company: registration.exhibitorName,
            registrationId: registration.registrationId || '',
            status: registration.status || '',
            companyAttendance: stats.companyAttendance || 0,
            totalPeople: stats.totalPeople || 0,
            passPeople: stats.passPeople || 0,
            lastCheckIn: stats.lastCheckIn || null
        };
    })
        .filter(company => company.companyAttendance === 1)
        .sort((a, b) => new Date(b.lastCheckIn || 0) - new Date(a.lastCheckIn || 0)
            || a.company.localeCompare(b.company));
}

router.get('/config', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    res.json({ success: true, data: context });
}));

router.post('/resolve', async (req, res) => {
    const context = await getEventContext(req.body.eventId);
    try {
        const person = await resolveRegistration(req.body.raw || req.body.registrationId || req.body, requestOrigin(req));
        const records = await Attendance.find({ eventId: context.eventId, subjectKey: person.subjectKey }).select('eventDay markedAt markedByName gate source').lean();
        await AttendanceScanAttempt.create({ eventId: context.eventId, registrationId: person.registrationId, subjectKey: person.subjectKey, subjectType: person.subjectType, result: 'resolved', source: req.body.source === 'manual' ? 'manual' : 'qr', attemptedBy: req.user.id, attemptedByName: req.user.username || '' });
        res.json({ success: true, data: { person, attendance: records, event: context.event, days: context.days } });
    } catch (error) {
        await AttendanceScanAttempt.create({ eventId: context.eventId, registrationId: String(req.body.registrationId || req.body.raw || '').slice(0, 150), result: 'invalid', source: req.body.source === 'manual' ? 'manual' : 'qr', attemptedBy: req.user.id, attemptedByName: req.user.username || '', detail: error.message || 'Invalid QR' }).catch(() => { });
        res.status(error.status || 500).json({ success: false, message: error.message || 'Could not resolve QR.' });
    }
});

router.patch('/buyers/:id/status', asyncRoute(async (req, res) => {
    const status = String(req.body.status || '').trim();
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Buyer status must be Pending, Approved or Rejected.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid buyer ID.' });
    }
    const buyer = await InternationalBuyer.findByIdAndUpdate(
        req.params.id,
        { $set: { 'verification.adminApprovalStatus': status } },
        { new: true, runValidators: true }
    ).lean();
    if (!buyer) return res.status(404).json({ success: false, message: 'International buyer not found.' });
    res.json({ success: true, message: `Buyer status changed to ${status}.`, data: { status } });
}));

router.post('/mark', asyncRoute(async (req, res) => {
    const origin = requestOrigin(req);
    const person = await resolveRegistration(req.body.raw || req.body.registrationId, origin);
    if (person.subjectSubType === 'international-buyer' && person.status !== 'Approved') {
        return res.status(409).json({
            success: false,
            message: `Attendance cannot be marked because this buyer is ${person.status || 'Pending'}. Approve the buyer first.`
        });
    }
    const company = person.attendanceKind === 'pass' && person.passType === 'exhibitor' && person.companyRegistrationId
        ? await resolveRegistration(person.companyRegistrationId, origin)
        : null;
    const context = await getEventContext(req.body.eventId);
    const requestedDays = Array.isArray(req.body.days) ? req.body.days : [req.body.day];
    const days = [...new Set(requestedDays.filter((day) => context.days.includes(day)))];
    if (!days.length) return res.status(400).json({ success: false, message: 'Select at least one valid event day.' });

    const base = {
        eventId: context.eventId, subjectKey: person.subjectKey, subjectId: person.subjectId,
        companyId: person.companyId, attendanceKind: person.attendanceKind, passType: person.passType,
        subjectType: person.subjectType, subjectSubType: person.subjectSubType,
        registrationId: person.registrationId, name: person.name, company: person.company,
        email: person.email, mobile: person.mobile, designation: person.designation,
        photoUrl: person.photoUrl, photoKind: person.photoKind, markedBy: req.user.id,
        markedByName: req.user.username || '', source: req.body.source === 'manual' ? 'manual' : 'qr',
        gate: String(req.body.gate || '').trim(), rawQr: String(req.body.raw || '').slice(0, 2000)
    };

    const results = await Promise.all(days.map(async (eventDay) => {
        const existing = await Attendance.findOne({ eventId: context.eventId, eventDay, subjectKey: person.subjectKey }).lean();
        const result = await Attendance.updateOne(
            { eventId: context.eventId, eventDay, subjectKey: person.subjectKey },
            { $set: base, $setOnInsert: { eventDay, markedAt: new Date() } },
            { upsert: true }
        );
        const created = result.upsertedCount === 1;
        await AttendanceScanAttempt.create({ eventId: context.eventId, registrationId: person.registrationId, subjectKey: person.subjectKey, subjectType: person.subjectType, result: created ? 'marked' : 'duplicate', source: req.body.source === 'manual' ? 'manual' : 'qr', attemptedBy: req.user.id, attemptedByName: req.user.username || '', detail: created ? eventDay : `Already marked ${eventDay} by ${existing?.markedByName || 'unknown'}` });
        await AttendanceAudit.create({ eventId: context.eventId, attendanceId: existing?._id || result.upsertedId, subjectKey: person.subjectKey, registrationId: person.registrationId, action: created ? 'created' : 'duplicate-scan', reason: created ? 'Attendance marked' : 'Repeated attendance attempt', before: existing || null, performedBy: req.user.id, performedByName: req.user.username || '', performedByRole: req.user.role || '' });
        let companyCreated = false;
        if (company) {
            const companyResult = await Attendance.updateOne(
                { eventId: context.eventId, eventDay, subjectKey: company.subjectKey },
                {
                    $set: {
                        eventId: context.eventId, eventDay, subjectKey: company.subjectKey,
                        subjectId: company.subjectId, companyId: company.companyId,
                        subjectType: 'exhibitor', subjectSubType: 'exhibitor',
                        attendanceKind: 'registration', registrationId: company.registrationId,
                        name: company.name, company: company.company, email: company.email,
                        mobile: company.mobile, designation: company.designation,
                        photoUrl: company.photoUrl, photoKind: company.photoKind, markedBy: req.user.id,
                        markedByName: req.user.username || '', source: 'qr',
                        gate: String(req.body.gate || '').trim(),
                        rawQr: String(req.body.raw || '').slice(0, 2000)
                    }, $setOnInsert: { markedAt: new Date() }
                },
                { upsert: true }
            );
            companyCreated = companyResult.upsertedCount === 1;
        }
        return { day: eventDay, created, companyCreated, duplicate: !created, existing: existing ? { markedAt: existing.markedAt, markedByName: existing.markedByName, gate: existing.gate, source: existing.source } : null };
    }));
    res.json({ success: true, message: 'Attendance processed successfully.', data: { person, results } });
}));

router.patch('/records/:id', asyncRoute(async (req, res) => {
    const reason = String(req.body.reason || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'Correction reason is required.' });
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    const before = record.toObject();
    const allowedDays = (await getEventContext(record.eventId)).days;
    if (req.body.eventDay && !allowedDays.includes(req.body.eventDay)) return res.status(400).json({ success: false, message: 'Invalid event day.' });
    if (req.body.eventDay) record.eventDay = req.body.eventDay;
    if (req.body.gate !== undefined) record.gate = String(req.body.gate || '').trim();
    await record.save();
    await AttendanceAudit.create({ eventId: record.eventId, attendanceId: record._id, subjectKey: record.subjectKey, registrationId: record.registrationId, action: 'corrected', reason, before, after: record.toObject(), performedBy: req.user.id, performedByName: req.user.username || '', performedByRole: req.user.role || '' });
    res.json({ success: true, message: 'Attendance corrected.', data: record });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
    const reason = String(req.body?.reason || req.query.reason || '').trim();
    if (!reason) return res.status(400).json({ success: false, message: 'Removal reason is required.' });
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    await AttendanceAudit.create({ eventId: deleted.eventId, attendanceId: deleted._id, subjectKey: deleted.subjectKey, registrationId: deleted.registrationId, action: 'removed', reason, before: deleted.toObject(), performedBy: req.user.id, performedByName: req.user.username || '', performedByRole: req.user.role || '' });
    res.json({ success: true, message: 'Attendance removed.' });
}));

router.get('/dashboard', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const match = { eventId: context.eventId };
    if (req.query.day && context.days.includes(req.query.day)) match.eventDay = req.query.day;
    if (req.query.type && ['visitor', 'buyer', 'exhibitor'].includes(req.query.type)) match.subjectType = req.query.type;
    if (req.query.subType) match.subjectSubType = req.query.subType;
    const summaryMatch = { ...match, attendanceKind: { $ne: 'pass' } };

    const overallMatch = { eventId: context.eventId, attendanceKind: { $ne: 'pass' } };
    const canonicalAttendanceIdentity = {
        $cond: [
            { $eq: ['$subjectType', 'exhibitor'] },
            {
                $cond: [
                    { $gt: [{ $strLenCP: { $ifNull: ['$registrationId', ''] } }, 0] },
                    { $concat: ['registration:', '$registrationId'] },
                    {
                        $cond: [
                            { $gt: [{ $strLenCP: { $ifNull: ['$companyId', ''] } }, 0] },
                            { $concat: ['company:', '$companyId'] },
                            '$subjectKey'
                        ]
                    }
                ]
            },
            '$subjectKey'
        ]
    };
    const [registered, perDay, byType, bySubType, recent, uniquePeople, companies, overallByType, overallBySubType] = await Promise.all([
        registeredTotals(),
        Attendance.aggregate([{ $match: { eventId: context.eventId } }, { $group: { _id: '$eventDay', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Attendance.aggregate([{ $match: summaryMatch }, {
            $group: {
                _id: '$subjectType',
                people: { $addToSet: canonicalAttendanceIdentity }
            }
        }]),
        Attendance.aggregate([{ $match: summaryMatch }, { $group: { _id: '$subjectSubType', people: { $addToSet: '$subjectKey' } } }]),
        Attendance.find(summaryMatch).sort({ markedAt: -1 }).limit(30).lean(),
        Attendance.aggregate([
            { $match: summaryMatch },
            {
                $group: {
                    _id: canonicalAttendanceIdentity
                }
            }
        ]),
        match.subjectType && match.subjectType !== 'exhibitor'
            ? Promise.resolve([])
            : companyAttendanceSummary(context.eventId, match.eventDay),
        Attendance.aggregate([{ $match: overallMatch }, {
            $group: {
                _id: '$subjectType',
                people: { $addToSet: canonicalAttendanceIdentity }
            }
        }]),
        Attendance.aggregate([{ $match: overallMatch }, { $group: { _id: '$subjectSubType', people: { $addToSet: '$subjectKey' } } }])
    ]);
    const attendedByType = Object.fromEntries(byType.map((item) => [item._id, item.people.length]));
    const attendedBySubType = Object.fromEntries(bySubType.map((item) => [item._id, item.people.length]));
    const overallAttendedByType = Object.fromEntries(overallByType.map((item) => [item._id, item.people.length]));
    const overallAttendedBySubType = Object.fromEntries(overallBySubType.map((item) => [item._id, item.people.length]));
    const totalRegistered = registered.visitor + registered.buyer + registered.exhibitor;
    const scopeRegistered = match.subjectSubType
        ? (registered.bySubType[match.subjectSubType] || 0)
        : match.subjectType ? (registered[match.subjectType] || 0) : totalRegistered;
    res.json({
        success: true, data: {
            event: context.event, days: context.days, selectedDay: match.eventDay || null,
            registered: { ...registered, total: totalRegistered },
            attended: { visitor: attendedByType.visitor || 0, buyer: attendedByType.buyer || 0, exhibitor: attendedByType.exhibitor || 0, total: uniquePeople.length, bySubType: attendedBySubType },
            overallAttended: { visitor: overallAttendedByType.visitor || 0, buyer: overallAttendedByType.buyer || 0, exhibitor: overallAttendedByType.exhibitor || 0, bySubType: overallAttendedBySubType },
            scopeRegistered,
            notAttended: Math.max(0, scopeRegistered - uniquePeople.length),
            perDay: context.days.map((day) => ({ day, count: perDay.find((item) => item._id === day)?.count || 0 })),
            recent,
            companies
        }
    });
}));

router.get('/records', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const query = { eventId: context.eventId };
    if (req.query.day) query.eventDay = req.query.day;
    if (req.query.type) query.subjectType = req.query.type;
    if (req.query.subType) query.subjectSubType = req.query.subType;
    if (req.query.companyId) query.companyId = String(req.query.companyId);
    if (req.query.passType) query.passType = String(req.query.passType);
    if (req.query.includeMembers !== 'true') query.attendanceKind = { $ne: 'pass' };
    if (req.query.search) {
        const regex = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ registrationId: regex }, { name: regex }, { company: regex }, { email: regex }, { mobile: regex }];
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const [records, total] = await Promise.all([
        Attendance.find(query).sort({ markedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Attendance.countDocuments(query)
    ]);
    res.json({ success: true, data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get('/directory/:type', asyncRoute(async (req, res) => {
    const type = String(req.params.type || '');
    if (!['visitor', 'buyer', 'exhibitor'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid directory type.' });
    const context = await getEventContext(req.query.eventId);
    const data = await getDirectory({ ...req.query, type, eventId: context.eventId, origin: requestOrigin(req) });
    res.json({ success: true, data: { ...data, days: context.days } });
}));

router.get('/manual-search', asyncRoute(async (req, res) => {
    const search = String(req.query.search || '').trim();
    if (search.length < 2) return res.json({ success: true, data: [] });
    const context = await getEventContext(req.query.eventId);
    const lists = await Promise.all(['visitor', 'buyer', 'exhibitor'].map(type => getDirectory({ type, view: 'all', search, page: 1, limit: 20, eventId: context.eventId, origin: requestOrigin(req) })));
    const items = lists.flatMap(list => list.items).slice(0, 50);
    res.json({ success: true, data: items, days: context.days });
}));

router.get('/insights', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const [rows, allAttendance, buyers, international, products] = await Promise.all([
        Attendance.find({ eventId: context.eventId, attendanceKind: { $ne: 'pass' }, subjectType: { $in: ['visitor', 'buyer'] } }).lean(),
        Attendance.find({ eventId: context.eventId }).select('eventDay subjectType subjectSubType subjectKey attendanceKind companyId').lean(),
        BuyerRegistration.find().select('country stateProvince city buyerIndustry primaryProductInterest secondaryProductCategories registrationCategory buyerTag').lean(),
        InternationalBuyer.find().select('country city natureOfBusiness productCategories b2bInterest').lean(),
        StallProduct.find({ isActive: { $ne: false } }).select('exhibitorId name category tags').lean()
    ]);
    const tally = (values) => Object.entries(values.filter(Boolean).reduce((map, item) => { const key = String(item).trim() || 'Unknown'; map[key] = (map[key] || 0) + 1; return map; }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    const buyerInterests = [...buyers.flatMap(item => [item.primaryProductInterest, ...(item.secondaryProductCategories || [])]), ...international.flatMap(item => item.productCategories || [])].filter(Boolean);
    const interestCounts = tally(buyerInterests);
    const matches = interestCounts.slice(0, 20).map(interest => ({ ...interest, products: products.filter(product => [product.category, ...(product.tags || [])].some(tag => String(tag || '').toLowerCase().includes(interest.label.toLowerCase()) || interest.label.toLowerCase().includes(String(tag || '').toLowerCase()))).slice(0, 8).map(product => ({ id: product._id, name: product.name, category: product.category, exhibitorId: product.exhibitorId })) }));
    const visitorTypes = Object.entries(rows.filter(item => item.subjectType === 'visitor').reduce((acc, item) => { acc[item.subjectSubType] = (acc[item.subjectSubType] || 0) + 1; return acc; }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    const buyerAttendanceTypes = Object.entries(rows.filter(item => item.subjectType === 'buyer').reduce((acc, item) => { acc[item.subjectSubType] = (acc[item.subjectSubType] || 0) + 1; return acc; }, {})).map(([label, count]) => ({ label, count }));
    const exhibitorRows = await Attendance.find({ eventId: context.eventId, subjectType: 'exhibitor' }).lean();
    const presentCompanies = new Set(exhibitorRows.filter(item => item.attendanceKind !== 'pass').map(item => item.companyId || item.subjectKey)).size;
    const topCompanies = Object.values(exhibitorRows.reduce((acc, item) => { const key = item.companyId || item.company || item.subjectKey; acc[key] ||= { label: item.company || item.name || 'Exhibitor', count: 0, members: new Set() }; acc[key].count += 1; if (item.attendanceKind === 'pass') acc[key].members.add(item.subjectKey); return acc; }, {})).map(item => ({ label: item.label, checkIns: item.count, members: item.members.size })).sort((a, b) => b.checkIns - a.checkIns).slice(0, 10);
    res.json({
        success: true, data: {
            attendance: { visitors: new Set(rows.filter(r => r.subjectType === 'visitor').map(r => r.subjectKey)).size, buyers: new Set(rows.filter(r => r.subjectType === 'buyer').map(r => r.subjectKey)).size },
            countries: tally([...buyers.map(i => i.country), ...international.map(i => i.country)]),
            cities: tally([...buyers.map(i => i.city), ...international.map(i => i.city)]),
            industries: tally(buyers.map(i => i.buyerIndustry)),
            buyerTypes: [{ label: 'Domestic', count: buyers.length }, { label: 'International', count: international.length }],
            visitorTypes, buyerAttendanceTypes,
            overview: {
                totalCheckIns: allAttendance.length,
                uniquePeople: new Set(allAttendance.map(item => item.subjectKey)).size,
                visitors: new Set(allAttendance.filter(item => item.subjectType === 'visitor').map(item => item.subjectKey)).size,
                buyers: new Set(allAttendance.filter(item => item.subjectType === 'buyer').map(item => item.subjectKey)).size,
                exhibitorCompanies: new Set(allAttendance.filter(item => item.subjectType === 'exhibitor' && item.attendanceKind !== 'pass').map(item => item.companyId || item.subjectKey)).size
            },
            dayWise: context.days.map(day => ({
                day,
                total: allAttendance.filter(item => item.eventDay === day).length,
                visitors: new Set(allAttendance.filter(item => item.eventDay === day && item.subjectType === 'visitor').map(item => item.subjectKey)).size,
                buyers: new Set(allAttendance.filter(item => item.eventDay === day && item.subjectType === 'buyer').map(item => item.subjectKey)).size,
                exhibitors: new Set(allAttendance.filter(item => item.eventDay === day && item.subjectType === 'exhibitor' && item.attendanceKind !== 'pass').map(item => item.companyId || item.subjectKey)).size
            })),
            categoryWise: Object.entries(allAttendance.reduce((acc, item) => {
                const key = item.subjectType || 'other'; acc[key] = (acc[key] || 0) + 1; return acc;
            }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
            exhibitors: { presentCompanies, teamCheckIns: exhibitorRows.filter(item => item.attendanceKind === 'pass').length, products: products.length, topCompanies },
            interestMatches: matches
        }
    });
}));

router.get('/notifications', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const now = Date.now(), fifteen = 15 * 60 * 1000;
    const vipBuyers = await BuyerRegistration.find({ registrationCategory: { $regex: /vip|hosted/i } }).select('registrationId').lean();
    const vipIds = vipBuyers.map(item => item.registrationId).filter(Boolean);
    const [recent, previous, special, suspicious, todayCount] = await Promise.all([
        Attendance.countDocuments({ eventId: context.eventId, markedAt: { $gte: new Date(now - fifteen) } }),
        Attendance.countDocuments({ eventId: context.eventId, markedAt: { $gte: new Date(now - (2 * fifteen)), $lt: new Date(now - fifteen) } }),
        Attendance.find({ eventId: context.eventId, $or: [{ subjectSubType: 'international-buyer' }, ...(vipIds.length ? [{ registrationId: { $in: vipIds } }] : [])] }).sort({ markedAt: -1 }).limit(10).select('name company subjectSubType registrationId markedAt photoUrl photoKind').lean(),
        AttendanceScanAttempt.aggregate([{ $match: { eventId: context.eventId, result: 'duplicate', createdAt: { $gte: new Date(now - 60 * 60 * 1000) } } }, { $group: { _id: '$registrationId', count: { $sum: 1 }, last: { $max: '$createdAt' } } }, { $match: { count: { $gte: 3 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        Attendance.countDocuments({ eventId: context.eventId, eventDay: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) })
    ]);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const target = Math.max(1, Number(context.event?.dailyAttendanceTarget) || 500);
    res.json({ success: true, data: { dailyTarget: { target, achieved: todayCount, percent: Math.min(100, Math.round(todayCount * 100 / target)), day: today, isEventDay: context.days.includes(today) }, highTraffic: recent >= Math.max(10, previous * 2), traffic: { recent15Minutes: recent, previous15Minutes: previous }, specialArrivals: special, suspicious } });
}));

router.patch('/daily-target', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.body.eventId);
    const target = Number(req.body.target);
    if (!Number.isInteger(target) || target < 1 || target > 1000000) {
        return res.status(400).json({ success: false, message: 'Daily target must be a whole number between 1 and 1,000,000.' });
    }
    await mongoose.model('Event').findByIdAndUpdate(context.eventId, { $set: { dailyAttendanceTarget: target } }, { runValidators: true });
    res.json({ success: true, message: 'Daily attendance target updated.', data: { target } });
}));

router.get('/super-admin/operations', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    const context = await getEventContext(req.query.eventId);
    const [users, marks, scans, corrections, recentAudit] = await Promise.all([
        User.find({ role: { $ne: 'exhibitor' } }).select('username fullName role designation profileImage status lastLogin').lean(),
        Attendance.aggregate([{ $match: { eventId: context.eventId } }, { $group: { _id: '$markedBy', total: { $sum: 1 }, manual: { $sum: { $cond: [{ $eq: ['$source', 'manual'] }, 1, 0] } }, qr: { $sum: { $cond: [{ $eq: ['$source', 'qr'] }, 1, 0] } }, days: { $addToSet: '$eventDay' }, lastAction: { $max: '$markedAt' } } }]),
        AttendanceScanAttempt.aggregate([{ $match: { eventId: context.eventId } }, { $group: { _id: '$attemptedBy', scans: { $sum: 1 }, duplicates: { $sum: { $cond: [{ $eq: ['$result', 'duplicate'] }, 1, 0] } }, invalid: { $sum: { $cond: [{ $eq: ['$result', 'invalid'] }, 1, 0] } } } }]),
        AttendanceAudit.aggregate([{ $match: { eventId: context.eventId, action: { $in: ['corrected', 'removed'] } } }, { $group: { _id: '$performedBy', corrections: { $sum: 1 } } }]),
        AttendanceAudit.find({ eventId: context.eventId }).sort({ createdAt: -1 }).limit(50).lean()
    ]);
    const byId = list => new Map(list.map(item => [String(item._id), item])); const markMap = byId(marks), scanMap = byId(scans), correctionMap = byId(corrections);
    res.json({ success: true, data: { employees: users.map(user => ({ ...user, stats: { ...(markMap.get(String(user._id)) || { total: 0, manual: 0, qr: 0, days: [] }), ...(scanMap.get(String(user._id)) || { scans: 0, duplicates: 0, invalid: 0 }), ...(correctionMap.get(String(user._id)) || { corrections: 0 }) } })), recentAudit } });
}));

router.get('/super-admin/operations/:userId', asyncRoute(async (req, res) => {
    if (!isSuperAdmin(req)) return res.status(403).json({ success: false, message: 'Super Administrator access only.' });
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
    const context = await getEventContext(req.query.eventId);
    const user = await User.findById(req.params.userId).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const day = req.query.day && context.days.includes(req.query.day) ? req.query.day : null;
    const source = ['qr', 'manual'].includes(req.query.source) ? req.query.source : null;
    const action = String(req.query.action || '');
    const recordQuery = { eventId: context.eventId, markedBy: user._id, ...(day ? { eventDay: day } : {}), ...(source ? { source } : {}) };
    const scanQuery = { eventId: context.eventId, attemptedBy: user._id, ...(source ? { source } : {}) };
    if (day) { const start = new Date(`${day}T00:00:00+05:30`), end = new Date(start); end.setDate(end.getDate() + 1); scanQuery.createdAt = { $gte: start, $lt: end }; }
    if (['resolved', 'marked', 'duplicate', 'invalid'].includes(action)) scanQuery.result = action;
    const auditQuery = { eventId: context.eventId, performedBy: user._id };
    if (['created', 'corrected', 'removed', 'duplicate-scan'].includes(action)) auditQuery.action = action;
    if (day) { const start = new Date(`${day}T00:00:00+05:30`), end = new Date(start); end.setDate(end.getDate() + 1); auditQuery.createdAt = { $gte: start, $lt: end }; }
    const [records, attempts, audits, allRecords, allAttempts, allAudits] = await Promise.all([
        Attendance.find(recordQuery).sort({ markedAt: -1 }).limit(500).lean(),
        AttendanceScanAttempt.find(scanQuery).sort({ createdAt: -1 }).limit(500).lean(),
        AttendanceAudit.find(auditQuery).sort({ createdAt: -1 }).limit(500).lean(),
        Attendance.find({ eventId: context.eventId, markedBy: user._id }).lean(),
        AttendanceScanAttempt.find({ eventId: context.eventId, attemptedBy: user._id }).lean(),
        AttendanceAudit.find({ eventId: context.eventId, performedBy: user._id }).lean()
    ]);
    const dayWise = context.days.map(eventDay => ({
        day: eventDay,
        marked: allRecords.filter(item => item.eventDay === eventDay).length,
        qr: allRecords.filter(item => item.eventDay === eventDay && item.source === 'qr').length,
        manual: allRecords.filter(item => item.eventDay === eventDay && item.source === 'manual').length,
        scans: allAttempts.filter(item => new Date(item.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === eventDay).length,
        duplicates: allAttempts.filter(item => item.result === 'duplicate' && new Date(item.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === eventDay).length,
        corrections: allAudits.filter(item => ['corrected', 'removed'].includes(item.action) && new Date(item.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === eventDay).length
    }));
    const origin = requestOrigin(req).replace(/\/$/, ''); const profile = String(user.profileImage || '');
    res.json({
        success: true, data: {
            user: { ...user, profileImage: profile && !/^https?:\/\//i.test(profile) ? `${origin}/${profile.replace(/^\//, '')}` : profile }, days: context.days, dayWise,
            summary: { marked: allRecords.length, qr: allRecords.filter(i => i.source === 'qr').length, manual: allRecords.filter(i => i.source === 'manual').length, scans: allAttempts.length, duplicates: allAttempts.filter(i => i.result === 'duplicate').length, invalid: allAttempts.filter(i => i.result === 'invalid').length, corrections: allAudits.filter(i => i.action === 'corrected').length, removals: allAudits.filter(i => i.action === 'removed').length },
            filtered: {
                records: action ? [] : records,
                attempts: ['corrected', 'removed', 'created', 'duplicate-scan'].includes(action) ? [] : attempts,
                audits: ['resolved', 'marked', 'duplicate', 'invalid'].includes(action) ? [] : audits
            }
        }
    });
}));

router.get('/directory-profile/:registrationId', asyncRoute(async (req, res) => {
    const profile = await resolveRegistration(decodeURIComponent(req.params.registrationId), requestOrigin(req));
    const context = await getEventContext(req.query.eventId);
    const attendance = await Attendance.find({ eventId: context.eventId, subjectKey: profile.subjectKey })
        .select('_id eventDay markedAt gate source markedByName').sort({ eventDay: 1 }).lean();
    res.json({ success: true, data: { profile, attendance } });
}));

router.get('/export', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const query = { eventId: context.eventId };
    if (req.query.day && context.days.includes(req.query.day)) query.eventDay = req.query.day;
    if (req.query.type && ['visitor', 'buyer', 'exhibitor'].includes(req.query.type)) query.subjectType = req.query.type;
    if (req.query.subType) query.subjectSubType = String(req.query.subType);
    if (req.query.companyId) query.companyId = String(req.query.companyId);
    if (req.query.search) {
        const regex = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ registrationId: regex }, { name: regex }, { company: regex }, { email: regex }, { mobile: regex }];
    }
    const records = await Attendance.find(query).sort({ eventDay: 1, markedAt: 1 }).lean();
    const companyMap = new Map();
    records.filter(record => record.subjectType === 'exhibitor' && record.companyId).forEach(record => {
        const id = String(record.companyId);
        const current = companyMap.get(id) || {
            companyId: id, name: record.company || record.name, registrationId: '', days: new Set(),
            companyCheckIns: 0, memberCheckIns: 0, members: new Set(), passTypes: new Set(), lastMarkedAt: null
        };
        current.days.add(record.eventDay);
        if (record.attendanceKind === 'pass') {
            current.memberCheckIns += 1;
            current.members.add(record.subjectKey);
            if (record.passType) current.passTypes.add(record.passType);
        } else {
            current.companyCheckIns += 1;
            current.registrationId ||= record.registrationId;
        }
        if (!current.lastMarkedAt || new Date(record.markedAt) > new Date(current.lastMarkedAt)) current.lastMarkedAt = record.markedAt;
        companyMap.set(id, current);
    });
    const companies = [...companyMap.values()].map(company => ({
        ...company,
        days: [...company.days].map(day => new Date(day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })).join(', '),
        uniqueMembers: company.members.size,
        passTypes: [...company.passTypes].join(', ')
    }));
    const workbook = await createAttendanceWorkbook({
        event: context.event, days: context.days, records, companies,
        filters: { day: query.eventDay, type: query.subjectType, subType: query.subjectSubType, search: req.query.search }
    });
    const scope = [query.subjectType, query.subjectSubType, query.eventDay].filter(Boolean).join('-') || 'overall';
    const filename = `IHWE-attendance-${scope}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
}));

router.get('/export/pdf', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const query = { eventId: context.eventId };
    if (req.query.day && context.days.includes(req.query.day)) query.eventDay = req.query.day;
    if (req.query.type && ['visitor', 'buyer', 'exhibitor'].includes(req.query.type)) query.subjectType = req.query.type;
    if (req.query.subType) query.subjectSubType = String(req.query.subType);
    const records = await Attendance.find(query).sort({ eventDay: 1, markedAt: 1 }).lean();
    const filename = `IHWE-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: 'IHWE Exhibition Attendance Summary' } }); doc.pipe(res);
    doc.rect(0, 0, 595, 105).fill('#071B33'); doc.fillColor('#F1C84B').fontSize(21).text('IHWE GO', 42, 34); doc.fillColor('#FFFFFF').fontSize(13).text('Exhibition Attendance Summary', 42, 65);
    doc.fillColor('#142033').fontSize(16).text(context.event?.name || 'International Health & Wellness Expo', 42, 128);
    doc.fontSize(9).fillColor('#64748B').text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Filters: ${[query.eventDay, query.subjectType, query.subjectSubType].filter(Boolean).join(' / ') || 'Overall'}`, 42, 154);
    const unique = new Set(records.map(r => r.subjectKey)).size; const visitors = new Set(records.filter(r => r.subjectType === 'visitor').map(r => r.subjectKey)).size; const buyers = new Set(records.filter(r => r.subjectType === 'buyer').map(r => r.subjectKey)).size; const exhibitors = new Set(records.filter(r => r.subjectType === 'exhibitor' && r.attendanceKind !== 'pass').map(r => r.companyId || r.subjectKey)).size;
    const metrics = [['CHECK-INS', records.length], ['UNIQUE', unique], ['VISITORS', visitors], ['BUYERS', buyers], ['EXHIBITORS', exhibitors]];
    metrics.forEach((m, i) => { const x = 42 + i * 101; doc.roundedRect(x, 185, 91, 57, 6).fill('#F4F7F6'); doc.fillColor('#23471D').fontSize(17).text(String(m[1]), x + 9, 198); doc.fillColor('#64748B').fontSize(7).text(m[0], x + 9, 222); });
    let y = 274; doc.fillColor('#142033').fontSize(13).text('Day-wise attendance', 42, y); y += 24;
    context.days.forEach(day => { const count = records.filter(r => r.eventDay === day).length; doc.fillColor('#23471D').fontSize(9).text(day, 42, y); doc.fillColor('#142033').text(String(count), 250, y, { width: 60, align: 'right' }); doc.moveTo(42, y + 14).lineTo(310, y + 14).strokeColor('#DCE5EC').stroke(); y += 25; });
    y += 12; doc.fillColor('#142033').fontSize(13).text('Category summary', 42, y); y += 24;
    Object.entries(records.reduce((acc, r) => { const key = String(r.subjectSubType || 'other').replace(/-/g, ' '); acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 16).forEach(([label, count]) => { if (y > 760) { doc.addPage(); y = 50; } doc.fillColor('#475569').fontSize(9).text(label, 42, y); doc.fillColor('#142033').text(String(count), 250, y, { width: 60, align: 'right' }); y += 19; });
    doc.end();
}));

router.post('/ai-summary', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.body.eventId);
    const scope = ['exhibition', 'company', 'person', 'employee'].includes(req.body.scope) ? req.body.scope : 'exhibition';
    let summaryData;
    if (scope === 'exhibition') {
        const records = await Attendance.find({ eventId: context.eventId })
            .select('-rawQr -__v -updatedAt').sort({ eventDay: 1, markedAt: 1 }).lean();
        const uniqueByType = type => new Set(records.filter(item => item.subjectType === type && item.attendanceKind !== 'pass').map(item => item.companyId || item.subjectKey)).size;
        summaryData = {
            event: context.event, eventDays: context.days,
            totals: {
                checkIns: records.length,
                visitors: uniqueByType('visitor'), buyers: uniqueByType('buyer'), exhibitors: uniqueByType('exhibitor'),
                companies: new Set(records.filter(item => item.subjectType === 'exhibitor' && item.companyId).map(item => item.companyId)).size
            },
            dayWise: context.days.map(day => ({
                day,
                checkIns: records.filter(item => item.eventDay === day).length,
                visitors: new Set(records.filter(item => item.eventDay === day && item.subjectType === 'visitor').map(item => item.subjectKey)).size,
                buyers: new Set(records.filter(item => item.eventDay === day && item.subjectType === 'buyer').map(item => item.subjectKey)).size,
                exhibitorCompanies: new Set(records.filter(item => item.eventDay === day && item.subjectType === 'exhibitor').map(item => item.companyId || item.subjectKey)).size
            })),
            registrationTypes: Object.entries(records.reduce((acc, item) => {
                acc[item.subjectSubType] = (acc[item.subjectSubType] || 0) + 1; return acc;
            }, {})).map(([type, count]) => ({ type, count })),
            passTypes: Object.entries(records.filter(item => item.attendanceKind === 'pass').reduce((acc, item) => {
                acc[item.passType || 'other'] = (acc[item.passType || 'other'] || 0) + 1; return acc;
            }, {})).map(([type, count]) => ({ type, count }))
        };
    } else if (scope === 'company') {
        if (!mongoose.Types.ObjectId.isValid(String(req.body.id))) {
            return res.status(400).json({ success: false, message: 'Valid company ID is required.' });
        }
        const [company, records, products, accessoryOrders] = await Promise.all([
            ExhibitorRegistration.findById(req.body.id)
                .select('exhibitorName registrationId contact1 participation country city status teamMembers').lean(),
            Attendance.find({ eventId: context.eventId, companyId: String(req.body.id) })
                .select('-rawQr -__v -updatedAt').sort({ eventDay: 1, markedAt: 1 }).lean(),
            StallProduct.find({ exhibitorId: req.body.id, isActive: { $ne: false } }).select('name category price moq').lean(),
            AccessoryOrder.find({ exhibitorRegistrationId: req.body.id }).select('orderNo items paymentStatus grandTotal createdAt').lean()
        ]);
        if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
        summaryData = {
            company: {
                name: company.exhibitorName, registrationId: company.registrationId,
                contactPerson: `${company.contact1?.firstName || ''} ${company.contact1?.lastName || ''}`.trim(),
                country: company.country, city: company.city, status: company.status,
                registeredTeamMembers: company.teamMembers?.length || 0
            },
            companyAttendanceDays: [...new Set(records.filter(item => item.attendanceKind !== 'pass').map(item => item.eventDay))],
            uniqueMembersAttended: new Set(records.filter(item => item.attendanceKind === 'pass').map(item => item.subjectKey)).size,
            memberAttendance: records.filter(item => item.attendanceKind === 'pass').map(item => ({
                name: item.name, designation: item.designation, passType: item.passType, eventDay: item.eventDay
            })),
            products,
            accessories: accessoryOrders.map(order => ({ orderNo: order.orderNo, paymentStatus: order.paymentStatus, grandTotal: order.grandTotal, items: (order.items || []).map(item => ({ name: item.name, type: item.type, qty: item.qty })) }))
        };
    } else if (scope === 'employee') {
        if (!isSuperAdmin(req) || !mongoose.Types.ObjectId.isValid(String(req.body.id))) return res.status(403).json({ success: false, message: 'Super Administrator employee summary only.' });
        const [user, records, attempts, audits] = await Promise.all([
            User.findById(req.body.id).select('username fullName role designation department status lastLogin').lean(),
            Attendance.find({ eventId: context.eventId, markedBy: req.body.id }).select('eventDay source subjectType subjectSubType markedAt').lean(),
            AttendanceScanAttempt.find({ eventId: context.eventId, attemptedBy: req.body.id }).select('result source createdAt').lean(),
            AttendanceAudit.find({ eventId: context.eventId, performedBy: req.body.id }).select('action reason createdAt').lean()
        ]);
        if (!user) return res.status(404).json({ success: false, message: 'Employee not found.' });
        summaryData = { employee: user, totals: { attendanceMarked: records.length, qr: records.filter(i => i.source === 'qr').length, manual: records.filter(i => i.source === 'manual').length, scans: attempts.length, duplicates: attempts.filter(i => i.result === 'duplicate').length, invalid: attempts.filter(i => i.result === 'invalid').length, corrections: audits.filter(i => i.action === 'corrected').length, removals: audits.filter(i => i.action === 'removed').length }, dayWise: context.days.map(day => ({ day, marked: records.filter(i => i.eventDay === day).length })) };
    } else {
        let record = mongoose.Types.ObjectId.isValid(String(req.body.id))
            ? await Attendance.findById(req.body.id).select('-rawQr -__v -updatedAt').lean()
            : null;
        if (!record && req.body.id) record = await Attendance.findOne({ registrationId: String(req.body.id) }).sort({ markedAt: -1 }).select('-rawQr -__v -updatedAt').lean();
        if (!record) {
            const live = await resolveRegistration(String(req.body.id || ''), requestOrigin(req));
            summaryData = { profile: live, attendance: [], note: 'Registered profile; no attendance has been marked yet.' };
        } else {
            let live = {};
            try { live = await resolveRegistration(record.registrationId, requestOrigin(req)); } catch (_) { /* snapshot is enough */ }
            const attendance = await Attendance.find({ eventId: record.eventId, subjectKey: record.subjectKey })
                .select('eventDay markedAt gate source').sort({ eventDay: 1 }).lean();
            summaryData = { profile: { ...record, ...live, rawQr: undefined, subjectId: undefined, subjectKey: undefined }, attendance };
        }
    }
    const summary = await aiService.generateAttendanceSummary({ scope, data: summaryData });
    res.json({ success: true, data: { scope, summary } });
}));

router.get('/profile/:attendanceId', asyncRoute(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.attendanceId))) {
        return res.status(400).json({ success: false, message: 'Invalid attendance profile ID.' });
    }
    const record = await Attendance.findById(req.params.attendanceId).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Attendance profile not found.' });
    let profile = { ...record };
    if (record.registrationId) {
        try {
            const live = await resolveRegistration(
                record.attendanceKind === 'pass' && record.rawQr ? record.rawQr : record.registrationId,
                requestOrigin(req)
            );
            profile = {
                ...profile,
                name: live.name || profile.name, company: live.company || profile.company,
                email: live.email || profile.email, mobile: live.mobile || profile.mobile,
                designation: live.designation || profile.designation,
                photoUrl: live.photoUrl || profile.photoUrl,
                photoKind: live.photoKind || profile.photoKind,
                country: live.country || profile.country,
                status: live.status || profile.status,
                details: live.details || {}
            };
        } catch (_) { /* attendance snapshot remains available */ }
    }
    if (record.attendanceKind === 'pass' && mongoose.Types.ObjectId.isValid(String(record.companyId))) {
        const exhibitor = await ExhibitorRegistration.findById(record.companyId).select('teamMembers').lean();
        const member = (exhibitor?.teamMembers || []).find(item =>
            String(item._id) === String(record.subjectId)
            || (record.email && String(item.email || '').toLowerCase() === String(record.email).toLowerCase())
            || (record.mobile && String(item.mobile || '').replace(/\D/g, '') === String(record.mobile).replace(/\D/g, ''))
        );
        const photo = String(member?.photoUrl || profile.photoUrl || '').trim();
        if (photo && !/^https?:\/\//i.test(photo) && !photo.startsWith('data:')) {
            profile.photoUrl = `${requestOrigin(req).replace(/\/$/, '')}/${photo.replace(/^\//, '')}`;
        } else if (photo) profile.photoUrl = photo;
    }
    const finalPhoto = String(profile.photoUrl || '').trim();
    if (finalPhoto && !/^https?:\/\//i.test(finalPhoto) && !finalPhoto.startsWith('data:')) {
        profile.photoUrl = `${requestOrigin(req).replace(/\/$/, '')}/${finalPhoto.replace(/^\//, '')}`;
    }
    const attendance = await Attendance.find({
        eventId: record.eventId,
        subjectKey: record.subjectKey
    }).select('eventDay markedAt gate markedByName').sort({ eventDay: 1 }).lean();
    const context = await getEventContext(record.eventId);
    res.json({ success: true, data: { profile, attendance, days: context.days } });
}));

router.get('/companies', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const day = req.query.day && context.days.includes(req.query.day) ? req.query.day : null;
    const companies = await companyAttendanceSummary(context.eventId, day);
    res.json({ success: true, data: companies });
}));

router.get('/companies/:companyId', asyncRoute(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.companyId))) {
        return res.status(400).json({ success: false, message: 'Invalid exhibitor company ID.' });
    }
    const context = await getEventContext(req.query.eventId);
    const company = await ExhibitorRegistration.findById(req.params.companyId)
        .select('exhibitorName registrationId clientId companyLogoUrl companyLogo contact1 teamMembers participation country city status primaryCategory subCategory industrySector selectedSectors otherSector typeOfBusiness fasciaName website address state pincode paymentMode paymentType paymentPlanType paymentPlanLabel chosenTdsPercent financeBreakdown amountPaid balanceAmount totalPayable paymentId razorpayOrderId pendingPayment receiptUrl receiptPdfUrl registrationPdfUrl paymentHistory manualPaymentDetails penaltyAmount penaltyReason paymentDueDate installments stallConflict')
        .lean();
    if (!company) return res.status(404).json({ success: false, message: 'Exhibitor company not found.' });
    const companyProfile = await resolveRegistration(company.registrationId, requestOrigin(req));
    let linkedCompany = company.clientId && mongoose.Types.ObjectId.isValid(String(company.clientId))
        ? await Company.findById(company.clientId).select('companyLogo companyName contacts stallNo stall_no').lean()
        : null;
    if (!linkedCompany) {
        linkedCompany = await Company.findOne({
            $or: [
                { exhibitorRegistrationId: String(company._id) },
                { companyName: company.exhibitorName }
            ]
        }).select('companyLogo companyName contacts stallNo stall_no').lean();
    }
    const rawStall = company.participation?.stallNo;
    let stallNumber = company.participation?.stallFor || linkedCompany?.stallNo || linkedCompany?.stall_no || '';
    if (rawStall && mongoose.Types.ObjectId.isValid(String(rawStall))) {
        const stall = await Stall.findById(rawStall).select('stallNumber').lean();
        if (stall?.stallNumber) stallNumber = stall.stallNumber;
    } else if (!stallNumber && rawStall) {
        stallNumber = String(rawStall);
    }
    if (!stallNumber) {
        const bookedStall = await Stall.findOne({ bookedBy: company._id, eventId: context.eventId }).select('stallNumber').lean();
        stallNumber = bookedStall?.stallNumber || '';
    }
    const origin = requestOrigin(req).replace(/\/$/, '');
    const assetUrl = value => {
        const path = String(value || '').trim();
        if (!path || /^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
        return `${origin}/${path.replace(/^\//, '')}`;
    };
    const companyLogo = assetUrl(company.companyLogoUrl || company.companyLogo || linkedCompany?.companyLogo);
    const query = { eventId: context.eventId, companyId: String(company._id) };
    if (req.query.day && context.days.includes(req.query.day)) query.eventDay = req.query.day;
    const [records, products, accessoryCatalog, accessoryOrders, stallArea] = await Promise.all([
        Attendance.find(query).sort({ markedAt: -1 }).lean(),
        StallProduct.find({ exhibitorId: company._id, isActive: { $ne: false } }).sort({ createdAt: -1 }).lean(),
        StallAccessory.find({ isActive: { $ne: false } }).sort({ category: 1, name: 1 }).lean(),
        AccessoryOrder.find({ exhibitorRegistrationId: company._id }).sort({ createdAt: -1 }).lean(),
        getExhibitorStallArea(company._id)
    ]);
    const companyAttendance = records.filter(item => item.attendanceKind !== 'pass');
    const memberAttendance = records
        .filter(item => item.attendanceKind === 'pass')
        .map(record => {
            const member = (company.teamMembers || []).find(item =>
                String(item._id) === String(record.subjectId)
                || (record.email && String(item.email || '').toLowerCase() === String(record.email).toLowerCase())
                || (record.mobile && String(item.mobile || '').replace(/\D/g, '') === String(record.mobile).replace(/\D/g, ''))
            );
            const crmContact = (linkedCompany?.contacts || []).find(item =>
                (record.email && String(item.email || '').toLowerCase() === String(record.email).toLowerCase())
                || (record.mobile && String(item.mobile || '').replace(/\D/g, '') === String(record.mobile).replace(/\D/g, ''))
            );
            return {
                ...record,
                photoUrl: assetUrl(record.photoUrl || member?.photoUrl || crmContact?.photoUrl || crmContact?.photo)
            };
        });
    res.json({
        success: true, data: {
            company: {
                companyId: String(company._id), name: company.exhibitorName,
                registrationId: company.registrationId, contactPerson: `${company.contact1?.firstName || ''} ${company.contact1?.lastName || ''}`.trim(),
                logoUrl: companyLogo, contactPhoto: companyProfile.photoUrl || '', stallNo: stallNumber,
                contactEmail: company.contact1?.email || '', contactMobile: company.contact1?.mobile || '', contactDesignation: company.contact1?.designation || '',
                exhibitorCategory: company.primaryCategory || company.subCategory || '', subCategory: company.subCategory || '',
                industrySector: company.industrySector || (company.selectedSectors || []).join(', ') || company.otherSector || '',
                selectedSectors: company.selectedSectors || [], typeOfBusiness: company.typeOfBusiness || '', website: company.website || '',
                country: company.country || '', city: company.city || '', status: company.status || '',
                stallInformation: { stallNo: stallNumber, stallFor: company.participation?.stallFor || '', stallSize: company.participation?.stallSize || null, stallCategory: company.participation?.stallCategory || '', stallType: company.participation?.stallType || '', stallScheme: company.participation?.stallScheme || '', dimension: company.participation?.dimension || '', fasciaName: company.fasciaName || '' }
            },
            days: context.days,
            companyAttendance,
            memberAttendance,
            paymentInformation: {
                status: company.status || '', paymentMode: company.paymentMode || '', paymentType: company.paymentType || '', paymentPlanType: company.paymentPlanType || '', paymentPlanLabel: company.paymentPlanLabel || '',
                chosenTdsPercent: company.chosenTdsPercent || 0, financeBreakdown: company.financeBreakdown || {}, totalPayable: company.totalPayable || company.financeBreakdown?.netPayable || 0,
                amountPaid: company.amountPaid || 0, balanceAmount: company.balanceAmount || 0, paymentId: company.paymentId || '', razorpayOrderId: company.razorpayOrderId || '', pendingPayment: company.pendingPayment || {},
                manualPaymentDetails: company.manualPaymentDetails || {}, paymentHistory: company.paymentHistory || [], installments: company.installments || [], penaltyAmount: company.penaltyAmount || 0, penaltyReason: company.penaltyReason || '', paymentDueDate: company.paymentDueDate || null,
                receiptUrl: assetUrl(company.receiptUrl), receiptPdfUrl: assetUrl(company.receiptPdfUrl), registrationPdfUrl: assetUrl(company.registrationPdfUrl), stallConflict: company.stallConflict || false
            },
            products: products.map(item => ({ ...item, images: (item.images || []).map(assetUrl) })),
            freeAccessories: accessoryCatalog.filter(item => item.type === 'complimentary').map(item => {
                const entitledQty = computeEntitlement({ allocationMode: item.allocationMode, fixedQty: item.includedQty, ratioQty: item.ratioQty, ratioArea: item.ratioArea, roundingMode: item.roundingMode }, stallArea);
                const claimedQty = accessoryOrders.reduce((sum, order) => sum + (order.items || []).filter(orderItem => String(orderItem.accessoryId) === String(item._id) && orderItem.type === 'complimentary').reduce((qty, orderItem) => qty + Number(orderItem.qty || 0), 0), 0);
                return { ...item, imageUrl: assetUrl(item.imageUrl), entitledQty, claimedQty, remainingQty: Math.max(0, entitledQty - claimedQty) };
            }),
            additionalAccessories: accessoryOrders.flatMap(order => (order.items || []).filter(item => item.type === 'purchasable').map(item => {
                const catalogItem = accessoryCatalog.find(accessory => String(accessory._id) === String(item.accessoryId));
                return {
                    ...item, orderNo: order.orderNo, paymentStatus: order.paymentStatus, orderedAt: order.createdAt,
                    imageUrl: assetUrl(catalogItem?.imageUrl), category: catalogItem?.category || '',
                    description: catalogItem?.description || '', unit: catalogItem?.unit || ''
                };
            }))
        }
    });
}));

module.exports = router;
