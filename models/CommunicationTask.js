const mongoose = require('mongoose');

const communicationTaskSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationConversation', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    status: { type: String, enum: ['assigned', 'accepted', 'in-progress', 'completed', 'cancelled'], default: 'assigned', index: true },
    dueAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    proofAttachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    statusHistory: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationTask', communicationTaskSchema);
