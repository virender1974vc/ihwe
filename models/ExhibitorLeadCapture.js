const mongoose = require('mongoose');

const exhibitorLeadCaptureSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true,
        index: true
    },
    sourceType: {
        type: String,
        enum: ['buyer', 'visitor', 'unknown'],
        default: 'unknown'
    },
    linkedBuyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuyerRegistration'
    },
    registrationId: { type: String, trim: true },
    name: { type: String, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    country: { type: String, trim: true },
    interest: { type: String, trim: true },
    notes: { type: String, trim: true },
    temperature: {
        type: String,
        enum: ['Hot', 'Warm', 'Cold', 'Uncategorized'],
        default: 'Uncategorized'
    },
    rawPayload: mongoose.Schema.Types.Mixed,
    scannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

exhibitorLeadCaptureSchema.index({ exhibitorId: 1, registrationId: 1 });
exhibitorLeadCaptureSchema.index({ exhibitorId: 1, email: 1 });
exhibitorLeadCaptureSchema.index({ exhibitorId: 1, phone: 1 });

module.exports = mongoose.model('ExhibitorLeadCapture', exhibitorLeadCaptureSchema);
