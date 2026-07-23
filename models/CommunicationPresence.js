const mongoose = require('mongoose');

const communicationPresenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    availability: { type: String, enum: ['available', 'busy', 'away', 'offline'], default: 'available' },
    aiAssistantEnabled: { type: Boolean, default: false },
    statusMessage: { type: String, maxlength: 250, default: '' },
    lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CommunicationPresence', communicationPresenceSchema);
