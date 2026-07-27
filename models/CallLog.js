const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    callerName: {
        type: String,
        required: true,
        trim: true
    },
    companyId: {
        type: String,
        required: true
    },
    // Multi-event support: which event this company/lead belonged to at call time.
    // Nullable — resolved from the Company doc when available, null for older data.
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        default: 0
    },
    recordingUrl: {
        type: String,
        default: ''
    },
    companyStatus: {
        type: String,
        required: true,
        default: 'New Lead'
    },
    notes: {
        type: String,
        default: '',
        trim: true
    },
    callDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('CallLog', CallLogSchema);
