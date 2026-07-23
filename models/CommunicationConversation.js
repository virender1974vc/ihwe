const mongoose = require('mongoose');

const communicationConversationSchema = new mongoose.Schema({
    superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },
    lastSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    superAdminUnread: { type: Number, default: 0, min: 0 },
    employeeUnread: { type: Number, default: 0, min: 0 },
    isPinnedBySuperAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

communicationConversationSchema.index(
    { superAdminId: 1, employeeId: 1 },
    { unique: true }
);

module.exports = mongoose.model('CommunicationConversation', communicationConversationSchema);
