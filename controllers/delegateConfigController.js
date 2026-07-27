const DelegateDay = require('../models/DelegateDay');
const DelegateSession = require('../models/DelegateSession');
const DelegatePass = require('../models/DelegatePass');

exports.getDaysWithSessions = async (req, res) => {
    try {
        const { eventId } = req.query;
        const query = eventId ? { eventId } : {};
        const days = await DelegateDay.find(query).sort({ displayOrder: 1 }).populate({
            path: 'sessions',
            match: { isActive: true },
            options: { sort: { displayOrder: 1, time: 1 } }
        });
        const passes = await DelegatePass.find({ isActive: true, ...query });
        res.json({ success: true, data: { days, passes } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllDaysAdmin = async (req, res) => {
    try {
        const { eventId } = req.query;
        const query = eventId ? { eventId } : {};
        const days = await DelegateDay.find(query).sort({ displayOrder: 1 }).populate({
            path: 'sessions',
            options: { sort: { displayOrder: 1, time: 1 } }
        });
        res.json({ success: true, data: days });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createDay = async (req, res) => {
    try {
        const newDay = await DelegateDay.create(req.body);
        res.status(201).json({ success: true, data: newDay });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateDay = async (req, res) => {
    try {
        const updated = await DelegateDay.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteDay = async (req, res) => {
    try {
        await DelegateSession.deleteMany({ dayId: req.params.id });
        await DelegateDay.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Day and associated sessions deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createSession = async (req, res) => {
    try {
        const newSession = await DelegateSession.create(req.body);
        res.status(201).json({ success: true, data: newSession });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateSession = async (req, res) => {
    try {
        const updated = await DelegateSession.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        await DelegateSession.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllPassesAdmin = async (req, res) => {
    try {
        const { eventId } = req.query;
        const passes = await DelegatePass.find(eventId ? { eventId } : {});
        res.json({ success: true, data: passes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPass = async (req, res) => {
    try {
        const newPass = await DelegatePass.create(req.body);
        res.status(201).json({ success: true, data: newPass });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updatePass = async (req, res) => {
    try {
        const updated = await DelegatePass.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deletePass = async (req, res) => {
    try {
        await DelegatePass.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Pass deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getDaysPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const { eventId } = req.query;

        const query = search ? {
            $or: [
                { date: { $regex: search, $options: 'i' } },
                { day: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { addedBy: { $regex: search, $options: 'i' } },
                { updatedBy: { $regex: search, $options: 'i' } }
            ]
        } : {};
        if (eventId) query.eventId = eventId;

        const total = await DelegateDay.countDocuments(query);
        const days = await DelegateDay.find(query)
            .populate('sessions')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ success: true, data: days, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSessionsPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const { eventId } = req.query;

        const query = search ? {
            $or: [
                { number: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { time: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { addedBy: { $regex: search, $options: 'i' } },
                { updatedBy: { $regex: search, $options: 'i' } }
            ]
        } : {};
        if (eventId) query.eventId = eventId;

        const total = await DelegateSession.countDocuments(query);
        const sessions = await DelegateSession.find(query)
            .populate('dayId', 'date day title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ success: true, data: sessions, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPassesPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const { eventId } = req.query;

        const query = search ? {
            $or: [
                { passKey: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { subtitle: { $regex: search, $options: 'i' } },
                { addedBy: { $regex: search, $options: 'i' } },
                { updatedBy: { $regex: search, $options: 'i' } }
            ]
        } : {};
        if (eventId) query.eventId = eventId;

        const total = await DelegatePass.countDocuments(query);
        const passes = await DelegatePass.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ success: true, data: passes, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
