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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
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
        type: Number, // duration in seconds
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
