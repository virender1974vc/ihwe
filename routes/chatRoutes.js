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
        const BuyerRegistration = require('../models/BuyerRegistration');

        // Fetch assigned exhibitors
        const exFilter = adminUsername ? { spokenWith: adminUsername } : { _id: null };
        const assignedExhibitors = await ExhibitorRegistration.find(exFilter)
            .select('_id exhibitorName registrationId participation spokenWith')
            .sort({ createdAt: -1 });

        // Fetch ALL buyers for now (or assigned if buyers have spokenWith)
        // Since buyers might not have 'spokenWith' yet, we show all who have messages
        const buyersWithMessages = await ChatMessage.distinct('buyerRegistrationId', { buyerRegistrationId: { $ne: null } });
        const buyers = await BuyerRegistration.find({ _id: { $in: buyersWithMessages } })
            .select('_id companyName companyFirmName registrationId');

        const exRooms = await Promise.all(assignedExhibitors.map(async (e) => {
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

        const buyerRooms = await Promise.all(buyers.map(async (b) => {
            const roomId = b._id.toString();
            const lastMsg = await ChatMessage.findOne({ roomId }).sort({ createdAt: -1 }).lean();
            const unreadAdmin = await ChatMessage.countDocuments({ roomId, senderType: 'buyer', readByAdmin: false });
            return {
                _id: roomId,
                buyerRegistrationId: b._id,
                buyerName: b.companyName || b.companyFirmName,
                registrationId: b.registrationId,
                isBuyer: true,
                lastMessage: lastMsg?.message || null,
                lastMessageAt: lastMsg?.createdAt || null,
                lastSenderType: lastMsg?.senderType || null,
                unreadAdmin,
                noMessages: !lastMsg,
            };
        }));

        const rooms = [...exRooms, ...buyerRooms];
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
        const { readerType } = req.body; // 'admin' or 'exhibitor' or 'buyer'
        if (readerType === 'admin') {
            await ChatMessage.updateMany({ roomId: req.params.roomId, senderType: { $in: ['exhibitor', 'buyer'] } }, { readByAdmin: true });
        } else if (readerType === 'exhibitor') {
            await ChatMessage.updateMany({ roomId: req.params.roomId, senderType: 'admin' }, { readByExhibitor: true });
        } else if (readerType === 'buyer') {
            await ChatMessage.updateMany({ roomId: req.params.roomId, senderType: 'admin' }, { readByBuyer: true });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Unread count for user
router.get('/unread/:roomId', flexAuth, async (req, res) => {
    try {
        const { userType } = req.query; // 'exhibitor' or 'buyer'
        const filter = {
            roomId: req.params.roomId,
            senderType: 'admin',
        };
        if (userType === 'buyer') {
            filter.readByBuyer = false;
        } else {
            filter.readByExhibitor = false;
        }
        const count = await ChatMessage.countDocuments(filter);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
