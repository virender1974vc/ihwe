const mongoose = require('mongoose');

const whatsAppLogSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmUser', default: null },
    senderName: { type: String, default: null },
    companyId: { type: String, default: null },
    companyName: { type: String, default: null },
    status: {
        type: String,
        enum: ['success', 'failed'],
        required: true
    },
    error: {
        type: String,
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WhatsAppLog', whatsAppLogSchema);
