const UserTarget = require('../models/UserTarget');
const CrmUser = require('../models/CrmUser');
const User = require('../models/User');
const mongoose = require('mongoose');

const getActorInfo = async (req) => {
    const user = req.user || {};
    const rawActorId = user.id || user._id || user.userId || user.user_id || null;
    const actorId = rawActorId && mongoose.Types.ObjectId.isValid(rawActorId) ? rawActorId : null;
    const fallbackName = user.fullName || user.name || user.username || user.user_name || 'Admin';

    if (!actorId && !user.username && !user.user_name) {
        return { actorId: null, actorName: fallbackName };
    }

    try {
        const query = actorId
            ? { _id: actorId }
            : { user_name: user.username || user.user_name };
        const actor = await CrmUser.findOne(query).select('user_fullname user_name').lean();
        if (actor?.user_fullname) {
            return {
                actorId: actor._id || actorId || null,
                actorName: actor.user_fullname
            };
        }

        const adminQuery = actorId
            ? { _id: actorId }
            : { username: user.username || user.user_name };
        const admin = await User.findOne(adminQuery).select('fullName username').lean();
        return {
            actorId: admin?._id || actorId || null,
            actorName: admin?.fullName || fallbackName
        };
    } catch (error) {
        return { actorId: actorId || null, actorName: fallbackName };
    }
};

class UserTargetController {
    async getAllTargets(req, res) {
        try {
            const targets = await UserTarget.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: targets });
        } catch (error) {
            console.error("Error fetching targets:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getTargetByUsername(req, res) {
        try {
            const target = await UserTarget.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
            if (!target) {
                return res.status(404).json({ success: false, message: 'Target not found' });
            }
            res.status(200).json({ success: true, data: target });
        } catch (error) {
            console.error("Error fetching target:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async createOrUpdateTarget(req, res) {
        try {
            const { username, callTarget, whatsappTarget, emailTarget, meetingTarget, revenueTarget, status } = req.body;

            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const { actorId, actorName } = await getActorInfo(req);
            let target = await UserTarget.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

            if (target) {
                target.callTarget = callTarget !== undefined ? callTarget : target.callTarget;
                target.whatsappTarget = whatsappTarget !== undefined ? whatsappTarget : target.whatsappTarget;
                target.emailTarget = emailTarget !== undefined ? emailTarget : target.emailTarget;
                target.meetingTarget = meetingTarget !== undefined ? meetingTarget : target.meetingTarget;
                target.revenueTarget = revenueTarget !== undefined ? revenueTarget : target.revenueTarget;
                target.status = status || target.status;
                target.updatedBy = actorId;
                target.updatedByFullName = actorName;
                await target.save();
                return res.status(200).json({ success: true, data: target, message: 'Target updated successfully' });
            } else {
                target = await UserTarget.create({
                    username,
                    callTarget,
                    whatsappTarget,
                    emailTarget,
                    meetingTarget,
                    revenueTarget,
                    status,
                    createdBy: actorId,
                    createdByFullName: actorName,
                    updatedBy: actorId,
                    updatedByFullName: actorName
                });
                return res.status(201).json({ success: true, data: target, message: 'Target created successfully' });
            }
        } catch (error) {
            console.error("Error saving target:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { username, userId } = req.query;
            if (!username) {
                return res.status(400).json({ success: false, message: 'username is required' });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const userFilter = userId ? { senderId: userId } : {};
            const callFilter = userId ? { callerId: userId } : {};

            const target = await UserTarget.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
            const targets = {
                call: target ? target.callTarget : 0,
                whatsapp: target ? target.whatsappTarget : 0,
                email: target ? target.emailTarget : 0,
                meeting: target ? target.meetingTarget : 0
            };

            const CallLog = require('../models/CallLog');
            const WhatsAppLog = require('../models/WhatsAppLog');
            const EmailLog = require('../models/EmailLog');

            const completed = {
                call: 0,
                whatsapp: 0,
                email: 0,
                meeting: 0
            };

            if (userId && userId !== 'undefined' && userId !== 'null') {
                completed.call = await CallLog.countDocuments({ ...callFilter, callDate: { $gte: today, $lt: tomorrow } });
                completed.whatsapp = await WhatsAppLog.countDocuments({ ...userFilter, sentAt: { $gte: today, $lt: tomorrow } });
                completed.email = await EmailLog.countDocuments({ ...userFilter, sentAt: { $gte: today, $lt: tomorrow } });
            }

            res.status(200).json({ success: true, targets, completed });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getRecentLogs(req, res) {
        try {
            const { userId, type } = req.query;
            const CallLog = require('../models/CallLog');
            const WhatsAppLog = require('../models/WhatsAppLog');
            const EmailLog = require('../models/EmailLog');

            let logs = [];
            const userFilter = userId ? { senderId: userId } : {};
            const callFilter = userId ? { callerId: userId } : {};

            if (type === 'calls') {
                logs = await CallLog.find(callFilter).sort({ createdAt: -1 }).limit(5).lean();
                logs = logs.map(l => ({ name: l.companyName || 'Unknown', time: l.createdAt, note: l.duration ? `Duration: ${l.duration}s` : 'Call logged' }));
            } else if (type === 'whatsapp') {
                logs = await WhatsAppLog.find(userFilter).sort({ sentAt: -1 }).limit(5).lean();
                logs = logs.map(l => ({ name: l.companyName || l.recipient || l.name || 'Unknown', time: l.sentAt, note: l.message }));
            } else if (type === 'emails') {
                logs = await EmailLog.find(userFilter).sort({ sentAt: -1 }).limit(5).lean();
                logs = logs.map(l => ({ name: l.companyName || l.name || 'Unknown', time: l.sentAt, note: l.message || l.subject }));
            }

            // console.log(`[getRecentLogs DEBUG] type: ${type}, userId: ${userId}, logs count: ${logs.length}`);

            res.status(200).json({ success: true, data: logs });
        } catch (error) {
            console.error("Error fetching recent logs:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getTableLogs(req, res) {
        try {
            const { userId, type, page = 1, limit = 10 } = req.query;
            const CallLog = require('../models/CallLog');
            const WhatsAppLog = require('../models/WhatsAppLog');
            const EmailLog = require('../models/EmailLog');

            let logs = [];
            let total = 0;
            const userFilter = userId ? { senderId: userId } : {};
            const callFilter = userId ? { callerId: userId } : {};

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            if (type === 'calls') {
                total = await CallLog.countDocuments(callFilter);
                logs = await CallLog.find(callFilter).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
            } else if (type === 'whatsapp') {
                total = await WhatsAppLog.countDocuments(userFilter);
                logs = await WhatsAppLog.find(userFilter).sort({ sentAt: -1 }).skip(skip).limit(limitNum);
            } else if (type === 'emails') {
                total = await EmailLog.countDocuments(userFilter);
                logs = await EmailLog.find(userFilter).sort({ sentAt: -1 }).skip(skip).limit(limitNum);
            }

            res.status(200).json({
                success: true,
                data: logs,
                pagination: {
                    total,
                    page: pageNum,
                    pages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            console.error("Error fetching table logs:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async deleteTarget(req, res) {
        try {
            const target = await UserTarget.findByIdAndDelete(req.params.id);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Target not found' });
            }
            res.status(200).json({ success: true, message: 'Target deleted successfully' });
        } catch (error) {
            console.error("Error deleting target:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new UserTargetController();
