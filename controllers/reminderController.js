const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

exports.createReminder = async (req, res) => {
    try {
        const { title, message, priority, targetAudience, type, scheduledFor, createdBy } = req.body;
        let targetUsers = [];
        if (req.body.targetUsers) {
            try {
                targetUsers = JSON.parse(req.body.targetUsers);
            } catch (e) {
                targetUsers = req.body.targetUsers;
            }
        }

        let audioUrl = "";
        if (req.file) {
            audioUrl = `/uploads/${req.file.filename}`;
        }

        const reminder = new Reminder({
            title,
            message,
            priority: priority || 'Medium',
            targetAudience,
            targetUsers,
            audioUrl,
            type,
            scheduledFor: type === 'scheduled' ? new Date(scheduledFor) : null,
            createdBy: createdBy || 'Admin'
        });

        await reminder.save();
        if (type === 'instant') {
            await dispatchPushNotifications(reminder);
            reminder.status = 'sent';
            await reminder.save();
        }

        res.status(201).json({ success: true, data: reminder });
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ added: -1 });
        res.status(200).json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyReminders = async (req, res) => {
    try {
        const userId = req.user.id;
        const exhibitor = await ExhibitorRegistration.findById(userId);

        let orConditions = [
            { targetAudience: 'all' },
            { targetUsers: new mongoose.Types.ObjectId(userId) }
        ];

        if (exhibitor) {
            orConditions.push({ targetAudience: 'confirmed_exhibitor' });
        }

        const reminders = await Reminder.find({
            status: 'sent',
            $or: orConditions
        }).sort({ added: -1 });

        res.status(200).json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { reminderId } = req.body;
        const userId = req.user.id;

        const reminder = await Reminder.findById(reminderId);
        if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

        const alreadyRead = reminder.readBy.some(id => String(id) === String(userId));
        if (!alreadyRead) {
            reminder.readBy.push(userId);
            await reminder.save();
        }

        res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.savePushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user.id;

        const exhibitor = await ExhibitorRegistration.findById(userId);
        if (!exhibitor) return res.status(404).json({ success: false, message: 'Exhibitor not found' });

        if (!exhibitor.expoPushTokens) {
            exhibitor.expoPushTokens = [];
        }

        if (!exhibitor.expoPushTokens.includes(pushToken)) {
            exhibitor.expoPushTokens.push(pushToken);
            await exhibitor.save();
        }

        res.status(200).json({ success: true, message: 'Token saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const dispatchPushNotifications = async (reminder) => {
    try {
        let query = {};
        if (reminder.targetAudience === 'confirmed_exhibitor') {
            query = {}; 
        } else if (reminder.targetAudience !== 'all' && reminder.targetUsers.length > 0) {
            query = { _id: { $in: reminder.targetUsers } };
        }

        const users = await ExhibitorRegistration.find(query).select('expoPushTokens');
        let pushTokens = [];
        users.forEach(u => {
            if (u.expoPushTokens && u.expoPushTokens.length > 0) {
                pushTokens.push(...u.expoPushTokens);
            }
        });

        if (pushTokens.length === 0) return;

        let messages = [];
        for (let pushToken of pushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title: reminder.title,
                body: reminder.message,
                data: { reminderId: reminder._id, audioUrl: reminder.audioUrl, priority: reminder.priority },
            });
        }

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push chunk:', error);
            }
        }
    } catch (error) {
        console.error('Push notification dispatch error:', error);
    }
};

exports.updateReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, priority, targetAudience, type, scheduledFor } = req.body;
        let targetUsers = [];
        if (req.body.targetUsers) {
            try { targetUsers = JSON.parse(req.body.targetUsers); } catch (e) { targetUsers = req.body.targetUsers; }
        }

        const updateData = { title, message, priority, targetAudience, type, targetUsers };
        if (type === 'scheduled') updateData.scheduledFor = new Date(scheduledFor);
        else updateData.scheduledFor = null;

        if (req.file) {
            updateData.audioUrl = `/uploads/${req.file.filename}`;
        }

        const reminder = await Reminder.findByIdAndUpdate(id, updateData, { new: true });
        if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });

        res.status(200).json({ success: true, data: reminder });
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resendReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const reminder = await Reminder.findById(id);
        if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });

        await dispatchPushNotifications(reminder);
        reminder.status = 'sent';
        reminder.added = new Date(); // Update time so it comes up first
        await reminder.save();

        res.status(200).json({ success: true, data: reminder, message: 'Reminder resent successfully' });
    } catch (error) {
        console.error('Error resending reminder:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.dispatchPushNotifications = dispatchPushNotifications;
