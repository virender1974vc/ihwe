const { Server } = require("socket.io");
const mongoose = require("mongoose");
const ChatMessage = require('../../models/crm/ChatMessage');

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    const onlineUsers = new Map();
    const roomSockets = new Map();

    io.on('connection', (socket) => {
        socket.on('join_room', ({ roomId, userId, userType, userName }) => {
            socket.join(roomId);
            onlineUsers.set(socket.id, { userId, userType, roomId, userName });
            if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
            roomSockets.get(roomId).add(socket.id);
            io.to(roomId).emit('user_status', { userId, userType, userName, online: true });
        });

        socket.on('join_admin', ({ adminId, adminName } = {}) => {
            socket.join('admin_room');
            if (adminName) socket.join(`admin_room_${adminName.toLowerCase()}`);
            if (adminId) onlineUsers.set(socket.id, { userId: adminId, userType: 'admin', roomId: 'admin_room', userName: adminName || 'Admin' });
        });

        socket.on('send_message', async ({ roomId, exhibitorRegistrationId, exhibitorName, buyerRegistrationId, buyerName, senderType, senderId, senderName, message }) => {
            if (mongoose.connection.readyState !== 1) return;
            try {
                const roomSocketIds = roomSockets.get(roomId) || new Set();
                const otherOnline = [...roomSocketIds].some(sid => {
                    const u = onlineUsers.get(sid);
                    return u && u.userId !== senderId;
                });

                const msg = await ChatMessage.create({
                    roomId,
                    exhibitorRegistrationId, exhibitorName,
                    buyerRegistrationId, buyerName,
                    senderType, senderId, senderName, message,
                    readByExhibitor: senderType === 'exhibitor' || otherOnline,
                    readByBuyer: senderType === 'buyer' || otherOnline,
                    readByAdmin: senderType === 'admin' || otherOnline,
                });

                io.to(roomId).emit('receive_message', msg);
                if (otherOnline) io.to(roomId).emit('messages_seen', { roomId, seenBy: senderType });

                if (senderType === 'exhibitor') {
                    const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
                    const exhibitor = await ExhibitorRegistration.findById(exhibitorRegistrationId).select('spokenWith');
                    const targetRoom = (exhibitor && exhibitor.spokenWith) ? `admin_room_${exhibitor.spokenWith.toLowerCase()}` : 'admin_room';
                    io.to(targetRoom).emit('room_updated', {
                        roomId, exhibitorName, lastMessage: message,
                        lastMessageAt: msg.createdAt, lastSenderType: senderType,
                        unreadIncrement: !otherOnline ? 1 : 0,
                        spokenWith: exhibitor?.spokenWith || ''
                    });
                } else if (senderType === 'buyer') {
                    io.to('admin_room').emit('room_updated', {
                        roomId, buyerName, lastMessage: message,
                        lastMessageAt: msg.createdAt, lastSenderType: senderType,
                        unreadIncrement: !otherOnline ? 1 : 0,
                        isBuyer: true
                    });
                }
            } catch (err) {
                console.error('Chat save error:', err.message);
            }
        });

        socket.on('mark_read', async ({ roomId, readerType }) => {
            if (mongoose.connection.readyState !== 1) return;
            try {
                if (readerType === 'admin') {
                    await ChatMessage.updateMany({ roomId, senderType: { $in: ['exhibitor', 'buyer'] }, readByAdmin: false }, { readByAdmin: true });
                } else if (readerType === 'exhibitor') {
                    await ChatMessage.updateMany({ roomId, senderType: 'admin', readByExhibitor: false }, { readByExhibitor: true });
                } else if (readerType === 'buyer') {
                    await ChatMessage.updateMany({ roomId, senderType: 'admin', readByBuyer: false }, { readByBuyer: true });
                }
                io.to(roomId).emit('messages_seen', { roomId, seenBy: readerType });
            } catch (err) {
                console.error('mark_read error:', err.message);
            }
        });

        socket.on('typing', ({ roomId, senderType, senderName }) => socket.to(roomId).emit('typing', { senderType, senderName, roomId }));
        socket.on('stop_typing', ({ roomId }) => socket.to(roomId).emit('stop_typing', { roomId }));

        socket.on('disconnect', () => {
            const user = onlineUsers.get(socket.id);
            if (user && user.roomId !== 'admin_room') {
                io.to(user.roomId).emit('user_status', { userId: user.userId, userType: user.userType, online: false });
                const rs = roomSockets.get(user.roomId);
                if (rs) { rs.delete(socket.id); if (rs.size === 0) roomSockets.delete(user.roomId); }
            }
            onlineUsers.delete(socket.id);
        });
    });

    return io;
}

module.exports = { initSocket };
