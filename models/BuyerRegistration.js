const mongoose = require("mongoose");

// Buyer leads live in this same collection (isLead: true) with only a few fields filled in.
// The full-registration fields are required only for real registrations; when the
// website/admin registration comes in for the same buyer, the lead is completed and isLead cleared.
// A lead converted through Accounts (payment received) keeps its short record, so it stays exempt too.
const requiredUnlessLead = function () { return !(this.isLead || this.convertedFromLead); };

const buyerRegistrationSchema = new mongoose.Schema(
  {
    // 0. CRM lead pipeline
    isLead: { type: Boolean, default: false },
    // Set when Accounts payments (not the website flow) moved this buyer to Converted.
    accountsPaid: { type: Boolean, default: false },
    convertedFromLead: { type: Boolean, default: false },
    // "Converted" is not stored — a buyer is converted once paymentStatus === 'Completed'.
    leadStatus: { type: String, enum: ['New Lead', 'Follow-Up', 'Proposal Sent', 'Hot Lead', 'Lost'], default: 'New Lead' },
    followUpDate: { type: Date, default: null },
    assignedTo: { type: String, trim: true },
    leadSource: { type: String, trim: true },
    createdBy: { type: String, default: null },
    // Every pipeline update made from the Buyer Lead overview (status / follow-up / assignee / remark).
    leadActivity: [{
      status: { type: String },
      remark: { type: String },
      assignedTo: { type: String },
      followUpDate: { type: Date },
      by: { type: String },
      at: { type: Date, default: Date.now },
    }],

    // 1. Basic Business Information
    fullName: { type: String, required: false, trim: true }, // Legacy
    designation: { type: String, required: false, trim: true }, // Legacy
    companyName: { type: String, required: true, trim: true },
    businessType: { type: String, required: requiredUnlessLead },
    companyFirmName: { type: String, required: false },
    basicBusinessType: { type: String, required: false },
    yearOfEstablishment: { type: String, required: false },
    gstNumber: { type: String },
    panNumber: { type: String },
    brandName: { type: String },

    // 2. Contact Information
    mobileNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    emailAddress: { type: String, required: requiredUnlessLead, trim: true, lowercase: true },
    website: { type: String, trim: true },
    registeredAddress: { type: String, required: requiredUnlessLead },
    pinCode: { type: String, required: requiredUnlessLead },
    country: { type: String, required: false },
    stateProvince: { type: String, required: requiredUnlessLead },
    city: { type: String, required: requiredUnlessLead },

    // 3. Business Profile
    natureOfBusiness: { type: String, required: false },
    yearsInBusiness: { type: String, required: false },
    numberOfOutlets: { type: String, required: false },
    annualTurnover: { type: String, required: requiredUnlessLead },
    buyerIndustry: { type: String },

    // 4. Sourcing & Buying Interests
    primaryProductInterest: { type: String, required: requiredUnlessLead },
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
    buyingFrequency: { type: String, required: false }, // One-time / Monthly / Quarterly / Long-term
    estimatedAnnualPurchaseValue: { type: String, required: requiredUnlessLead },
    purchaseTimeline: { type: String, required: requiredUnlessLead }, // Immediate / 1–3 Months / 3–6 Months / Exploring
    roleInPurchaseDecision: { type: String, required: requiredUnlessLead }, // Final Decision Maker / Influencer / Research Only
    experienceWithIndianSuppliers: { type: String }, // First time / Regular / Limited / None

    // 7. Matchmaking Interest
    matchmakingInterest: { type: String, default: "Yes" }, // Yes/No

    // 8. Certification & Compliance Requirements
    requiredCertifications: { type: [String], default: [] }, // ISO / GMP / FDA / AYUSH / Organic / Others

    // 9. Pricing Preference
    pricingPreference: { type: String, required: false }, // Premium / Mid-Range / Budget

    // 10. B2B Meeting Preferences
    preferredMeetingDate: { type: String, required: false },
    preferredMeetingDay: { type: String, required: false },
    preferredTimeSlot: { type: String, required: false },
    requirePreScheduledB2B: { type: String, required: false }, // Yes/No
    preferredMeetingCategories: { type: [String], default: [] },
    preferredExhibitorTypes: { type: [String], default: [] },
    numberOfMeetingsInterested: { type: String }, // 3–5 / 5–10 / 10+
    meetingObjectives: { type: [String], default: [] },
    preferredBusinessTypes: { type: [String], default: [] },
    meetingRequirements: { type: String },
    meetingPriorityLevel: { type: String, required: false }, // High / Medium / General

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
    registrationCategory: { type: String, required: requiredUnlessLead }, // Standard / VIP / Hosted
    registrationFee: { type: String, required: false, default: "0" }, // Made optional to avoid validation errors
    paymentMode: { type: String, required: requiredUnlessLead }, // UPI / Card / Net Banking
    transactionId: { type: String },
    paymentProof: { type: String }, // File path for screenshot

    // 16. Consent & Declaration
    consentTerms: { type: Boolean, default: false },
    consentPaymentValid: { type: Boolean, default: false },
    consentMatchedExhibitors: { type: Boolean, default: false },


    registrationId: { type: String, unique: true, sparse: true },
    qrCode: { type: String },
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
    eventName: { type: String },
    domainName: { type: String, default: "ihwe" }

  },
  { timestamps: true }
);

module.exports = mongoose.model("BuyerRegistration", buyerRegistrationSchema);
