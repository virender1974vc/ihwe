const mongoose = require('mongoose');

const communicationAuditSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationConversation', index: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationMessage', default: null },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationAudit', communicationAuditSchema);
