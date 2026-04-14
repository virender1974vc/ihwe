const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
    title: String,
    firstName: String,
    lastName: String,
    email: String,
    designation: String,
    mobile: { type: String, required: true },
    alternateNo: { type: String, required: true }
});

const ParticipationSchema = new mongoose.Schema({
    stallNo: String,
    stallFor: String,
    stallSize: Number,
    stallCategory: String,
    stallType: String,
    stallScheme: String,
    dimension: String,
    currency: { type: String, default: 'INR' },
    rate: Number,
    discount: Number,
    amount: Number,
    gstPercent: { type: Number, default: 18 },
    total: Number
});

const ExhibitorRegistrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationId: { type: String, unique: true, sparse: true },
    exhibitorName: { type: String, required: true },
    typeOfBusiness: String,
    industrySector: String,
    website: String,
    address: String,
    country: String,
    state: String,
    city: String,
    pincode: String,
    landlineNo: String,
    gstNo: String,
    panNo: String,
    natureOfBusiness: String,
    fasciaName: String,
    primaryCategory: String,
    subCategory: String,
    contact1: ContactPersonSchema,
    contact2: ContactPersonSchema,
    participation: ParticipationSchema,
    selectedSectors: [String],
    otherSector: String,
    referredBy: {
        type: String,
        default: null // Name of marketing person
    },
    spokenWith: {
        type: String,
        default: null // Name of staff who spoke with them
    },
    filledBy: {
        type: String,
        default: 'User' // Name of admin/employee or 'User'
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid', 'advance-paid', 'confirmed'], default: 'pending' },
    paymentMode: { type: String, enum: ['manual', 'online'], default: 'manual' },
    paymentType: { type: String, enum: ['advance', 'full'], default: 'full' },
    amountPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    receiptUrl: String,
    manualPaymentDetails: {
        method: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'DD', 'Other', 'Online'], default: 'Online' },
        transactionId: String,
        notes: String,
        advancePercent: { type: Number, default: 100 }, // 100 = Full payment, < 100 = Advance
        updatedAt: Date
    },
    // Vendor Login Credentials
    password: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorRegistration', ExhibitorRegistrationSchema);
