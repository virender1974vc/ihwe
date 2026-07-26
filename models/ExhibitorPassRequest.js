const mongoose = require('mongoose');

const exhibitorPassRequestSchema = new mongoose.Schema({
    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExhibitorRegistration',
        required: true
    },
    passType: {
        type: String,
        enum: ['exhibitor', 'vehicle', 'service', 'visitor', 'delegate', 'lunch', 'water'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    vehicles: [{
        teamMemberId: { type: mongoose.Schema.Types.ObjectId },
        vehicleType: { type: String, enum: ['2-wheeler', '4-wheeler'] },
        vehicleNumber: { type: String, trim: true },
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        photoUrl: { type: String, trim: true }
    }],
    personnel: [{
        teamMemberId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String, trim: true },
        designation: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        photoUrl: { type: String, trim: true },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        aadhaarNumber: { type: String, trim: true }
    }],
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'free'],
        default: 'free'
    },
    paidQuantity: { type: Number, default: 0 },
    baseAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    qrVersion: { type: Number, min: 1, default: 1 },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorPassRequest', exhibitorPassRequestSchema);
