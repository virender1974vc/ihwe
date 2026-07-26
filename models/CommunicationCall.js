const mongoose = require('mongoose');

const communicationCallSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationConversation', required: true, index: true },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    calleeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['audio', 'video'], required: true },
    status: { type: String, enum: ['ringing', 'accepted', 'rejected', 'missed', 'ended', 'failed'], default: 'ringing', index: true },
    startedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endReason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationCall', communicationCallSchema);
