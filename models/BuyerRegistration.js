const mongoose = require("mongoose");

const buyerRegistrationSchema = new mongoose.Schema(
  {
    // 1. Basic Business Information
    fullName: { type: String, required: false, trim: true }, // Legacy
    designation: { type: String, required: false, trim: true }, // Legacy
    companyName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true },
    companyFirmName: { type: String, required: true },
    basicBusinessType: { type: String, required: true },
    yearOfEstablishment: { type: String, required: true },
    gstNumber: { type: String },
    panNumber: { type: String },
    brandName: { type: String },

    // 2. Contact Information
    mobileNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    emailAddress: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String, trim: true },
    registeredAddress: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, required: false },
    stateProvince: { type: String, required: true },
    city: { type: String, required: true },

    // 3. Business Profile
    natureOfBusiness: { type: String, required: true },
    yearsInBusiness: { type: String, required: true },
    numberOfOutlets: { type: String, required: true },
    annualTurnover: { type: String, required: true },
    buyerIndustry: { type: String },

    // 4. Sourcing & Buying Interests
    primaryProductInterest: { type: String, required: true },
    secondaryProductCategories: { type: [String], default: [] },
    specificProductRequirements: { type: String },
    estimatedPurchaseVolume: { type: String },
    budgetRange: { type: String },
    purchaseFrequency: { type: String },
    businessModelPreference: { type: String },
    b2bMeetInterest: { type: String, default: "Yes" },
    interestedInImporting: { type: String, default: "No" },
    interestedInExporting: { type: String, default: "No" },

    // 5. Supplier Preference (India Only)
    preferredSupplierRegion: { type: [String], default: [] }, // North / South / East / West / Pan India
    preferredState: { type: [String], default: [] },
    preferredSupplierType: { type: [String], default: [] }, // Manufacturer / Exporter / MSME / Startup / Wholesaler
    preferredCompanySize: { type: String }, // Small / Medium / Large

    // 6. Purchase Intent & Capacity
    buyingFrequency: { type: String, required: true }, // One-time / Monthly / Quarterly / Long-term
    estimatedAnnualPurchaseValue: { type: String, required: true },
    purchaseTimeline: { type: String, required: true }, // Immediate / 1–3 Months / 3–6 Months / Exploring
    roleInPurchaseDecision: { type: String, required: true }, // Final Decision Maker / Influencer / Research Only
    experienceWithIndianSuppliers: { type: String }, // First time / Regular / Limited / None

    // 7. Matchmaking Interest
    matchmakingInterest: { type: String, default: "Yes" }, // Yes/No

    // 8. Certification & Compliance Requirements
    requiredCertifications: { type: [String], default: [] }, // ISO / GMP / FDA / AYUSH / Organic / Others

    // 9. Pricing Preference
    pricingPreference: { type: String, required: true }, // Premium / Mid-Range / Budget

    // 10. B2B Meeting Preferences
    preferredMeetingDate: { type: String, required: true },
    preferredMeetingDay: { type: String, required: true },
    preferredTimeSlot: { type: String, required: true },
    requirePreScheduledB2B: { type: String, required: true }, // Yes/No
    preferredMeetingCategories: { type: [String], default: [] },
    preferredExhibitorTypes: { type: [String], default: [] },
    numberOfMeetingsInterested: { type: String }, // 3–5 / 5–10 / 10+
    meetingObjectives: { type: [String], default: [] },
    preferredBusinessTypes: { type: [String], default: [] },
    meetingRequirements: { type: String },
    meetingPriorityLevel: { type: String, required: true }, // High / Medium / General

    // 11. Logistics & Shipping
    logisticsRequirements: { type: String },

    // 12. Preferred Payment Methods
    preferredPaymentMethods: { type: [String], default: [] },

    // 13. Source of Information
    sourceOfInformation: { type: String },

    // 14. Company Profile
    companyProfile: { type: String }, // File path

    // 12/14. Additional Information
    remarks: { type: String },

    // 15. Paid Registration Details
    registrationCategory: { type: String, required: true }, // Standard / VIP / Hosted
    registrationFee: { type: String, required: false, default: "0" }, // Made optional to avoid validation errors
    paymentMode: { type: String, required: true }, // UPI / Card / Net Banking
    transactionId: { type: String },
    paymentProof: { type: String }, // File path for screenshot

    // 16. Consent & Declaration
    consentTerms: { type: Boolean, default: false },
    consentPaymentValid: { type: Boolean, default: false },
    consentMatchedExhibitors: { type: Boolean, default: false },


    registrationId: { type: String, unique: true, sparse: true },
    buyerTag: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },
    otpVerifiedEmail: { type: Boolean, default: false },
    otpVerifiedMobile: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Login Credentials
    password: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },


  },
  { timestamps: true }
);

module.exports = mongoose.model("BuyerRegistration", buyerRegistrationSchema);
