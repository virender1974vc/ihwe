const mongoose = require('mongoose');

const delegateRegistrationSchema = new mongoose.Schema({
    // Personal Details
    title: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    designation: { type: String, required: true },
    organization: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: { type: String },

    // Address Details
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    profileImage: { type: String },

    // Interests
    regNo: { type: String, unique: true },
    industrySector: { type: String, required: true },
    typeOfBusiness: { type: String, required: true },
    sessions: [{
        session: { type: mongoose.Schema.Types.ObjectId, ref: 'DelegateSession' },
        title: String,
        date: String,
        time: String,
        price: Number
    }],
    specialPasses: [{
        pass: { type: mongoose.Schema.Types.ObjectId, ref: 'DelegatePass' },
        passKey: String,
        title: String,
        price: Number
    }],

    // Pricing & Payment
    subTotal: { type: Number, required: true, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    gstAmount: { type: Number, required: true, default: 0 },
    gatewayChargePercentage: { type: Number, default: 2.5 },
    gatewayChargeAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },

    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentMode: { type: String, default: 'online' },
    paymentReceipt: { type: String },
    paymentRemarks: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('DelegateRegistration', delegateRegistrationSchema);
