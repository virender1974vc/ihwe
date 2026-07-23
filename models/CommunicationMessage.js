const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video', 'document', 'audio'], default: 'document' },
    bytes: { type: Number, default: 0 }
}, { _id: false });

const communicationMessageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationConversation', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderRole: { type: String, required: true },
    senderName: { type: String, default: '' },
    kind: { type: String, enum: ['text', 'media', 'system', 'ai', 'task'], default: 'text' },
    text: { type: String, trim: true, maxlength: 10000, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationMessage', default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedText: { type: String, default: '' },
    aiGenerated: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

communicationMessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('CommunicationMessage', communicationMessageSchema);
