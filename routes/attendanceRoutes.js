const express = require('express');
const Attendance = require('../models/Attendance');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const Company = require('../models/Company');
const Stall = require('../models/Stall');
const mongoose = require('mongoose');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { resolveRegistration, getEventContext, registeredTotals } = require('../services/attendanceService');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

const asyncRoute = (handler) => async (req, res) => {
    try { await handler(req, res); }
    catch (error) { res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' }); }
};
const requestOrigin = (req) => `${String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0]}://${req.get('host')}`;

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

router.post('/resolve', asyncRoute(async (req, res) => {
    const person = await resolveRegistration(req.body.raw || req.body.registrationId || req.body, requestOrigin(req));
    const context = await getEventContext(req.body.eventId);
    const records = await Attendance.find({ eventId: context.eventId, subjectKey: person.subjectKey }).select('eventDay markedAt markedByName').lean();
    res.json({ success: true, data: { person, attendance: records, event: context.event, days: context.days } });
}));

router.post('/mark', asyncRoute(async (req, res) => {
    const origin = requestOrigin(req);
    const person = await resolveRegistration(req.body.raw || req.body.registrationId, origin);
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
        const result = await Attendance.updateOne(
            { eventId: context.eventId, eventDay, subjectKey: person.subjectKey },
            { $set: base, $setOnInsert: { eventDay, markedAt: new Date() } },
            { upsert: true }
        );
        let companyCreated = false;
        if (company) {
            const companyResult = await Attendance.updateOne(
                { eventId: context.eventId, eventDay, subjectKey: company.subjectKey },
                { $set: {
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
                }, $setOnInsert: { markedAt: new Date() } },
                { upsert: true }
            );
            companyCreated = companyResult.upsertedCount === 1;
        }
        return { day: eventDay, created: result.upsertedCount === 1, companyCreated };
    }));
    res.json({ success: true, message: 'Attendance processed successfully.', data: { person, results } });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    res.json({ success: true, message: 'Attendance removed.' });
}));

router.get('/dashboard', asyncRoute(async (req, res) => {
    const context = await getEventContext(req.query.eventId);
    const match = { eventId: context.eventId };
    if (req.query.day && context.days.includes(req.query.day)) match.eventDay = req.query.day;
    if (req.query.type && ['visitor', 'buyer', 'exhibitor'].includes(req.query.type)) match.subjectType = req.query.type;
    if (req.query.subType) match.subjectSubType = req.query.subType;
    const summaryMatch = { ...match, attendanceKind: { $ne: 'pass' } };

    const [registered, perDay, byType, bySubType, recent, uniquePeople, companies] = await Promise.all([
        registeredTotals(),
        Attendance.aggregate([{ $match: { eventId: context.eventId } }, { $group: { _id: '$eventDay', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Attendance.aggregate([{ $match: summaryMatch }, { $group: {
            _id: '$subjectType',
            people: { $addToSet: { $cond: [
                { $and: [{ $eq: ['$subjectType', 'exhibitor'] }, { $ne: ['$companyId', ''] }] },
                { $concat: ['company:', '$companyId'] }, '$subjectKey'
            ] } }
        } }]),
        Attendance.aggregate([{ $match: summaryMatch }, { $group: { _id: '$subjectSubType', people: { $addToSet: '$subjectKey' } } }]),
        Attendance.find(summaryMatch).sort({ markedAt: -1 }).limit(30).lean(),
        Attendance.aggregate([
            { $match: summaryMatch },
            { $group: { _id: { $cond: [
                { $and: [{ $eq: ['$subjectType', 'exhibitor'] }, { $ne: ['$companyId', ''] }] },
                { $concat: ['company:', '$companyId'] }, '$subjectKey'
            ] } } }
        ]),
        match.subjectType && match.subjectType !== 'exhibitor'
            ? Promise.resolve([])
            : companyAttendanceSummary(context.eventId, match.eventDay)
    ]);
    const attendedByType = Object.fromEntries(byType.map((item) => [item._id, item.people.length]));
    const attendedBySubType = Object.fromEntries(bySubType.map((item) => [item._id, item.people.length]));
    const totalRegistered = registered.visitor + registered.buyer + registered.exhibitor;
    const scopeRegistered = match.subjectSubType
        ? (registered.bySubType[match.subjectSubType] || 0)
        : match.subjectType ? (registered[match.subjectType] || 0) : totalRegistered;
    res.json({ success: true, data: {
        event: context.event, days: context.days, selectedDay: match.eventDay || null,
        registered: { ...registered, total: totalRegistered },
        attended: { visitor: attendedByType.visitor || 0, buyer: attendedByType.buyer || 0, exhibitor: attendedByType.exhibitor || 0, total: uniquePeople.length, bySubType: attendedBySubType },
        scopeRegistered,
        notAttended: Math.max(0, scopeRegistered - uniquePeople.length),
        perDay: context.days.map((day) => ({ day, count: perDay.find((item) => item._id === day)?.count || 0 })),
        recent,
        companies
    } });
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
    const attendance = await Attendance.find({
        eventId: record.eventId,
        subjectKey: record.subjectKey
    }).select('eventDay markedAt gate markedByName').sort({ eventDay: 1 }).lean();
    res.json({ success: true, data: { profile, attendance } });
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
        .select('exhibitorName registrationId clientId companyLogoUrl companyLogo contact1 teamMembers participation country city status')
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
    const records = await Attendance.find(query).sort({ markedAt: -1 }).lean();
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
    res.json({ success: true, data: {
        company: {
            companyId: String(company._id), name: company.exhibitorName,
            registrationId: company.registrationId, contactPerson: `${company.contact1?.firstName || ''} ${company.contact1?.lastName || ''}`.trim(),
            logoUrl: companyLogo, contactPhoto: companyProfile.photoUrl || '', stallNo: stallNumber,
            country: company.country || '', city: company.city || '', status: company.status || ''
        },
        days: context.days,
        companyAttendance,
        memberAttendance
    } });
}));

module.exports = router;
