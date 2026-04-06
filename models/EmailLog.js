const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    message: {
        type: String,
        default: null
    },
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

module.exports = mongoose.model('EmailLog', emailLogSchema);
