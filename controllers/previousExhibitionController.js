const PreviousExhibition = require('../models/PreviousExhibition');
const User = require('../models/User');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/logger');

const auditUser = async (req) => {
    const userId = String(req.user?.id || req.user?._id || '');
    const user = userId ? await User.findById(userId).select('username fullName').lean() : null;
    return {
        userId,
        username: String(user?.username || req.user?.username || req.user?.name || req.user?.email || 'Admin'),
        fullName: String(user?.fullName || '')
    };
};

const enrichAuditNames = async (items) => {
    const userIds = [...new Set(items.flatMap((item) => [
        item.createdBy?.userId,
        item.updatedBy?.userId
    ]).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    if (!userIds.length) return items;

    const users = await User.find({ _id: { $in: userIds } })
        .select('_id username fullName')
        .lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));

    return items.map((item) => {
        for (const field of ['createdBy', 'updatedBy']) {
            const user = usersById.get(String(item[field]?.userId || ''));
            if (user) {
                item[field] = {
                    ...item[field],
                    username: user.username || item[field]?.username || 'Admin',
                    fullName: user.fullName || item[field]?.fullName || ''
                };
            }
        }
        return item;
    });
};

const cleanPayload = (body) => ({
    name: String(body.name || '').trim(),
    status: body.status === 'Inactive' ? 'Inactive' : 'Active'
});

const validate = (data) => {
    if (!data.name) {
        return 'Exhibition name is required.';
    }
    return null;
};

const findDuplicate = (payload, excludedId) => PreviousExhibition.findOne({
    ...(excludedId ? { _id: { $ne: excludedId } } : {}),
    name: {
        $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i'
    }
}).lean();

const handleError = (res, error) => {
    if (error?.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'This exhibition name already exists.'
        });
    }
    console.error('Previous exhibition error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
};

exports.getPublic = async (_req, res) => {
    try {
        const data = await PreviousExhibition.find({ status: 'Active' })
            .select('name')
            .collation({ locale: 'en', strength: 2 })
            .sort({ name: 1 })
            .lean();
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getAll = async (_req, res) => {
    try {
        const records = await PreviousExhibition.find()
            .collation({ locale: 'en', strength: 2 })
            .sort({ name: 1 })
            .lean();
        const data = await enrichAuditNames(records);
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error);
    }
};

exports.create = async (req, res) => {
    try {
        const payload = cleanPayload(req.body);
        const validationError = validate(payload);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }
        if (await findDuplicate(payload)) {
            return res.status(409).json({
                success: false,
                message: 'This exhibition name already exists.'
            });
        }

        const actor = await auditUser(req);
        const data = await PreviousExhibition.create({
            ...payload,
            createdBy: actor,
            updatedBy: actor
        });
        await logActivity(req, 'Created', 'Previous Exhibition List',
            `Created ${data.name}`);
        res.status(201).json({ success: true, message: 'Previous exhibition created.', data });
    } catch (error) {
        handleError(res, error);
    }
};

exports.update = async (req, res) => {
    try {
        const payload = cleanPayload(req.body);
        const validationError = validate(payload);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }
        if (await findDuplicate(payload, req.params.id)) {
            return res.status(409).json({
                success: false,
                message: 'This exhibition name already exists.'
            });
        }

        const data = await PreviousExhibition.findByIdAndUpdate(
            req.params.id,
            { ...payload, updatedBy: await auditUser(req) },
            { returnDocument: 'after', runValidators: true }
        );
        if (!data) {
            return res.status(404).json({ success: false, message: 'Previous exhibition not found.' });
        }
        await logActivity(req, 'Updated', 'Previous Exhibition List',
            `Updated ${data.name}`);
        res.json({ success: true, message: 'Previous exhibition updated.', data });
    } catch (error) {
        handleError(res, error);
    }
};

exports.remove = async (req, res) => {
    try {
        const data = await PreviousExhibition.findByIdAndDelete(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: 'Previous exhibition not found.' });
        }
        await logActivity(req, 'Deleted', 'Previous Exhibition List',
            `Deleted ${data.name}`);
        res.json({ success: true, message: 'Previous exhibition deleted.' });
    } catch (error) {
        handleError(res, error);
    }
};
