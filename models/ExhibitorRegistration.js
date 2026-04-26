const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
    title: String,
    firstName: String,
    lastName: String,
    email: String,
    designation: String,
    mobile: String,
    alternateNo: String
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
    aadhaarNo: String,
    registrantType: { type: String, enum: ['registered', 'unregistered'], default: 'registered' },
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
        default: null
    },
    spokenWith: {
        type: String,
        default: null
    },
    filledBy: {
        type: String,
        default: 'User'
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid', 'advance-paid', 'confirmed', 'payment-failed'], default: 'pending' },
    paymentMode: { type: String, enum: ['manual', 'online'], default: 'manual' },
    paymentType: { type: String, default: 'full' },
    paymentPlanType: { type: String, default: 'full' },
    paymentPlanLabel: { type: String, default: 'Full Payment' },
    chosenTdsPercent: { type: Number, default: 0 }, // 0, 1, 2, 10
    financeBreakdown: {
        grossAmount: { type: Number, default: 0 },          // gross cost after PL increment, before any discount
        stallDiscountPercent: { type: Number, default: 0 }, // stall-specific discount %
        stallDiscountAmount: { type: Number, default: 0 },  // stall-specific discount amount
        subtotal1: { type: Number, default: 0 },            // after stall discount
        discountPercent: { type: Number, default: 0 },      // full payment discount %
        discountAmount: { type: Number, default: 0 },       // full payment discount amount
        subtotal: { type: Number, default: 0 },             // taxable value (pre-GST, pre-TDS)
        gstAmount: { type: Number, default: 0 },            // GST 18% on subtotal
        tdsPercent: { type: Number, default: 0 },           // TDS % chosen
        tdsAmount: { type: Number, default: 0 },            // TDS on subtotal (not on GST)
        netPayable: { type: Number, default: 0 }            // subtotal + GST - TDS (cash buyer pays)
    },
    amountPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
    receiptUrl: String,
    registrationPdfUrl: String,
    receiptPdfUrl: String,
    paymentHistory: [{
        amount: Number,
        paymentType: String,
        paymentMode: String,
        method: String,
        transactionId: String,
        razorpayPaymentId: String,
        notes: String,
        paidAt: { type: Date, default: Date.now },
        receiptPdfUrl: String
    }],
    manualPaymentDetails: {
        method: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'DD', 'Other', 'Online'], default: 'Online' },
        transactionId: String,
        notes: String,
        advancePercent: { type: Number, default: 100 },
        updatedAt: Date
    },
    penaltyAmount: { type: Number, default: 0 },
    penaltyReason: String,
    penaltyAddedAt: Date,
    penaltyAddedBy: String,
    penaltyHistory: [{
        amount: Number,
        reason: String,
        addedBy: String,
        addedAt: { type: Date, default: Date.now },
        removedAt: Date,
        removedBy: String
    }],
    paymentDueDate: Date,
    lastWarningSentAt: Date,
    warningCount: { type: Number, default: 0 },
    warningHistory: [{
        sentAt: { type: Date, default: Date.now },
        type: { type: String, enum: ['email', 'whatsapp', 'both'] },
        message: String,
        daysOverdue: Number,
        sentBy: String
    }],
    installments: [{
        installmentNumber: Number,
        planId: String,
        label: String,
        percentage: Number,
        dueAmount: Number,
        paidAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
        dueDate: Date,
        paidAt: Date,
        razorpayPaymentId: String,
        razorpayOrderId: String,
        paymentMethod: String
    }],
    totalPayable: { type: Number, default: 0 },
    password: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    msme: {
        udyamRegNo: String,
        udyamMobileNo: String,
        udyamEmailId: String,
        udyamContactPerson: String,
        udyamDesignation: String,
        udyamAddress: String,
        udyamIssueDate: Date,
        udyamCertificateUrl: String,
        dfoLocation: String,
        dfoEmail: String,
        dfoMobileNo: String,
        msmeCategory: { type: String, enum: ['Manufacturer', 'Service Provider', 'Trader', 'Others'], default: 'Manufacturer' },
        msmeRemark: String,
        updatedAt: Date
    },
    isSeller: { type: Boolean, default: false },
    sellerStatus: { type: String, enum: ['none', 'pending', 'active', 'expired'], default: 'none' },
    sellerSubscription: {
        status: { type: String, enum: ['inactive', 'active', 'expired'], default: 'inactive' },
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerSubscriptionPlan' },
        plan: String,
        amount: Number,
        startDate: Date,
        endDate: Date,
        expiresAt: Date,
        paymentId: String,
        transactionId: String,
        notes: String
    },
    bankDetails: {
        bankName: String,
        accountHolder: String,
        accountNumber: String,
        ifscCode: String,
        branch: String,
        accountType: { type: String, enum: ['Savings', 'Current'], default: 'Current' }
    },
    companyLogoUrl: String,
    panCardFrontUrl: String,
    panCardBackUrl: String,
    aadhaarCardFrontUrl: String,
    aadhaarCardBackUrl: String,
    gstCertificateUrl: String,
    cancelledChequeUrl: String,
    representativePhotoUrl: String,
    brandName: String,
    companyDescription: String,
    productCategories: [String],
    businessRegistrationNo: String,
    logo: String,
    brochure: String,
    productCatalogue: String,
    socialMedia: {
        facebook: String,
        instagram: String,
        linkedin: String,
        twitter: String,
        youtube: String
    },
    billingContact: ContactPersonSchema,
    accountsContact: ContactPersonSchema,
    kycDocuments: {
        gstCertificate: String,
        panCard: String,
        registrationCertificate: String,
        authorizedSignatoryId: String
    },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'reupload'], default: 'pending' },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    documentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    specialDocuments: [{
        label: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorRegistration', ExhibitorRegistrationSchema);
