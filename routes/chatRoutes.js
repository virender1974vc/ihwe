const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');

const flexAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret_key');
        } catch (_) {}
    }
    next();
};
router.get('/messages/:roomId', flexAuth, async (req, res) => {
    try {
        const msgs = await ChatMessage.find({ roomId: req.params.roomId })
            .sort({ createdAt: 1 })
            .limit(200);
        res.json({ success: true, data: msgs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get('/rooms', flexAuth, async (req, res) => {
    try {
        const adminUsername = req.query.adminUsername || '';
        const adminRole = req.query.adminRole || '';
        const isSuperAdmin = adminRole === 'super-admin';
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
        const filter = adminUsername ? { spokenWith: adminUsername } : { _id: null };
        const assignedExhibitors = await ExhibitorRegistration.find(filter)
            .select('_id exhibitorName registrationId participation spokenWith')
            .sort({ createdAt: -1 });

        // For each assigned exhibitor, get their last message and unread count
        const rooms = await Promise.all(assignedExhibitors.map(async (e) => {
            const roomId = e._id.toString();
            const lastMsg = await ChatMessage.findOne({ roomId }).sort({ createdAt: -1 }).lean();
            const unreadAdmin = await ChatMessage.countDocuments({ roomId, senderType: 'exhibitor', readByAdmin: false });
            return {
                _id: roomId,
                exhibitorRegistrationId: e._id,
                exhibitorName: e.exhibitorName,
                registrationId: e.registrationId,
                stallNo: e.participation?.stallFor || '',
                spokenWith: e.spokenWith || '',
                lastMessage: lastMsg?.message || null,
                lastMessageAt: lastMsg?.createdAt || null,
                lastSenderType: lastMsg?.senderType || null,
                unreadAdmin,
                noMessages: !lastMsg,
            };
        }));
        rooms.sort((a, b) => {
            if (!a.lastMessageAt && !b.lastMessageAt) return 0;
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });

        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Mark messages as read
router.put('/read/:roomId', flexAuth, async (req, res) => {
    try {
        const { readerType } = req.body; // 'admin' or 'exhibitor'
        if (readerType === 'admin') {
            await ChatMessage.updateMany({ roomId: req.params.roomId, senderType: 'exhibitor' }, { readByAdmin: true });
        } else {
            await ChatMessage.updateMany({ roomId: req.params.roomId, senderType: 'admin' }, { readByExhibitor: true });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Unread count for exhibitor
router.get('/unread/:roomId', flexAuth, async (req, res) => {
    try {
        const count = await ChatMessage.countDocuments({
            roomId: req.params.roomId,
            senderType: 'admin',
            readByExhibitor: false
        });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
