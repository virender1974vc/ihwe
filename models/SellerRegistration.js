const mongoose = require("mongoose");

const sellerRegistrationSchema = new mongoose.Schema(
  {
    // 1. Basic Business Information
    fullName: { type: String, required: false, trim: true },
    designation: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true },
    companyFirmName: { type: String, required: true },
    basicBusinessType: { type: String, required: true },
    yearOfEstablishment: { type: String, required: true },
    gstNumber: { type: String },
    panNumber: { type: String },

    // 2. Contact Information
    mobileNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    emailAddress: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String, trim: true },
    registeredAddress: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, required: false, default: "India" },
    stateProvince: { type: String, required: true },
    city: { type: String, required: true },

    // 3. Business Profile
    natureOfBusiness: { type: String, required: true },
    yearsInBusiness: { type: String, required: true },
    numberOfOutlets: { type: String },
    annualTurnover: { type: String, required: true },

    // 4. Selling & Product Details
    primaryProductCategory: { type: String, required: true },
    secondaryProductCategories: { type: [String], default: [] },
    specificProductDetails: { type: String },
    productionCapacity: { type: String },
    targetMarket: { type: [String], default: [] },

    // 5. Buyer Preference (Target Audience)
    preferredBuyerType: { type: [String], default: [] }, // Distributor / Wholesaler / Retailer / etc.
    preferredBuyerRegion: { type: [String], default: [] },

    // 6. Sale Capacity
    sellingFrequency: { type: String },
    estimatedAnnualSaleValue: { type: String },
    leadTime: { type: String },

    // 7. Matchmaking Interest
    matchmakingInterest: { type: String, default: "Yes" },

    // 8. Certification & Compliance
    certifications: { type: [String], default: [] },

    // 9. Pricing Strategy
    pricingRange: { type: String }, // Premium / Mid-Range / Budget

    // 10. B2B Meeting Preferences
    preferredMeetingDate: { type: String, required: true },
    preferredTimeSlot: { type: String, required: true },
    requirePreScheduledB2B: { type: String, required: true },
    meetingPriorityLevel: { type: String, required: true },

    // 11. Logistics & Shipping Capability
    shippingTermsIndices: { type: [String], default: [] }, // FOB / CIF / etc.

    // 12. Preferred Payment Terms
    preferredPaymentTerms: { type: [String], default: [] },

    // 13. Source of Information
    sourceOfInformation: { type: String },

    // 14. Company Profile / Catalog
    companyCatalog: { type: String }, // File path

    // 15. Remarks
    remarks: { type: String },

    // 16. Paid Registration Details
    registrationCategory: { type: String, required: true },
    registrationFee: { type: String, required: false, default: "0" },
    paymentMode: { type: String, required: true },
    transactionId: { type: String },
    paymentProof: { type: String },

    // 17. Consent & Declaration
    consentTerms: { type: Boolean, default: false },
    consentPaymentValid: { type: Boolean, default: false },
    consentMatchedBuyers: { type: Boolean, default: false },

    // CRM / System Internal Fields
    registrationId: { type: String, unique: true, sparse: true },
    sellerTag: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },
    otpVerifiedEmail: { type: Boolean, default: false },
    otpVerifiedMobile: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    password: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerRegistration", sellerRegistrationSchema);
