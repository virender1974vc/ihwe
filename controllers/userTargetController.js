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
            // Only fetch active targets
            const targets = await UserTarget.find({ validTo: null }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: targets });
        } catch (error) {
            console.error("Error fetching targets:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getTargetHistory(req, res) {
        try {
            const { username } = req.params;
            const history = await UserTarget.find({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                validTo: { $ne: null }
            }).sort({ validFrom: -1 });

            res.status(200).json({ success: true, data: history });
        } catch (error) {
            console.error("Error fetching target history:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getTargetByUsername(req, res) {
        try {
            const target = await UserTarget.findOne({
                username: { $regex: new RegExp(`^${req.params.username}$`, 'i') },
                validTo: null
            });
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
            const { username, daily, weekly, monthly, yearly, status } = req.body;

            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const { actorId, actorName } = await getActorInfo(req);

            // Find current active target
            let activeTarget = await UserTarget.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                validTo: null
            });

            const now = new Date();

            if (activeTarget) {
                // Expire the current target
                activeTarget.validTo = now;
                await activeTarget.save();
            }

            // Create new active target
            const newTarget = await UserTarget.create({
                username,
                daily: daily || {},
                weekly: weekly || {},
                monthly: monthly || {},
                yearly: yearly || {},
                status: status || 'Active',
                validFrom: now,
                validTo: null,
                createdBy: actorId,
                createdByFullName: actorName,
                updatedBy: actorId,
                updatedByFullName: actorName
            });

            return res.status(activeTarget ? 200 : 201).json({
                success: true,
                data: newTarget,
                message: activeTarget ? 'Target updated successfully' : 'Target created successfully'
            });

        } catch (error) {
            console.error("Error saving target:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async getDashboardStats(req, res) {
        try {
            const { username, userId, period } = req.query;
            if (!username) {
                return res.status(400).json({ success: false, message: 'username is required' });
            }

            // period could be 'today', 'this_week', 'this_month', 'this_year'
            // or we might receive a specific month like '2026-06'
            let start, end;
            const now = new Date();

            if (req.query.month || req.query.targetMonth) {
                const targetMonth = req.query.month || req.query.targetMonth;
                const [year, monthIndex] = targetMonth.split('-').map(Number);
                start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
                end = new Date(year, monthIndex, 1, 0, 0, 0, 0);
            } else if (period === 'today') {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            } else if (period === 'this_week') {
                const day = now.getDay() || 7; // Sunday is 0, make it 7 for ISO week
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), start.getDate() + 7, 0, 0, 0);
            } else if (period === 'this_year') {
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
                end = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
            } else {
                // Default to this month
                start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
            }

            const target = await UserTarget.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                $or: [{ validTo: null }, { status: 'Active' }]
            }).sort({ createdAt: -1 });
            let targetObj = { callTarget: 0, whatsappTarget: 0, emailTarget: 0, meetingTarget: 0 };
            if (target) {
                if (period === 'today') targetObj = target.daily;
                else if (period === 'this_week') targetObj = target.weekly;
                else if (period === 'this_year') targetObj = target.yearly;
                else targetObj = target.monthly; // default
            }

            const targets = {
                call: targetObj.callTarget || 0,
                whatsapp: targetObj.whatsappTarget || 0,
                email: targetObj.emailTarget || 0,
                meeting: targetObj.meetingTarget || 0
            };

            const userFilter = userId ? { senderId: userId } : {};
            const callFilter = userId ? { callerId: userId } : {};

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
                completed.call = await CallLog.countDocuments({ ...callFilter, callDate: { $gte: start, $lt: end } });
                completed.whatsapp = await WhatsAppLog.countDocuments({ ...userFilter, sentAt: { $gte: start, $lt: end } });
                completed.email = await EmailLog.countDocuments({ ...userFilter, sentAt: { $gte: start, $lt: end } });
            }

            res.status(200).json({ success: true, targets, completed, periodRange: { start, end } });
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
            // Delete only makes it inactive or removes it completely?
            // To be safe, we will just delete it, or set validTo = now and status = Inactive
            // Since it's deleteTarget, let's just delete it and its history or just set validTo = now.
            // Let's actually delete all history for this user to keep it simple and clean, or just the current one?
            // "agar hum update krta hai toh vo change ho jayega"
            // Usually delete means remove completely. Let's find the target by ID and remove it.
            const target = await UserTarget.findById(req.params.id);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Target not found' });
            }
            // Delete all targets for this username
            await UserTarget.deleteMany({ username: target.username });
            res.status(200).json({ success: true, message: 'Target and history deleted successfully' });
        } catch (error) {
            console.error("Error deleting target:", error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new UserTargetController();
