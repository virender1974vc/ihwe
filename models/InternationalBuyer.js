const mongoose = require("mongoose");

// Buyer leads live in this same collection (isLead: true); full-registration fields are
// required only for real registrations. "Converted" = paymentStatus === 'Completed'.
// A lead converted through Accounts (payment received) keeps its short record, so it stays exempt too.
const requiredUnlessLead = function () { return !(this.isLead || this.convertedFromLead); };

const internationalBuyerSchema = new mongoose.Schema(
  {
    isLead: { type: Boolean, default: false },
    // Set when Accounts payments (not the website flow) moved this buyer to Converted.
    accountsPaid: { type: Boolean, default: false },
    convertedFromLead: { type: Boolean, default: false },
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
    eventName: { type: String },
    // Section 1 – Company Information
    brandName: { type: String, required: true, trim: true },
    legalEntityType: { 
      type: String
    },
    countryOfRegistration: { type: String, required: requiredUnlessLead },
    registrationStatus: { type: String, enum: ['India', 'Other Country'], default: 'Other Country' },
    yearOfEstablishment: { type: String },
    registrationNumber: { type: String },
    taxRegistrationNumber: { type: String },
    importExportCode: { type: String },
    businessLicenseNumber: { type: String },
    natureOfBusiness: { type: [String], default: [] }, // Multiple: Manufacturer, Exporter, etc.

    // Section 2 – Registered Office Details
    address: { type: String, required: requiredUnlessLead },
    city: { type: String, required: requiredUnlessLead },
    stateProvince: { type: String },
    country: { type: String, required: requiredUnlessLead },
    postalCode: { type: String },
    website: { type: String },
    linkedInPage: { type: String },
    socialMediaLinks: { type: [String], default: [] },

    // Section 3 – Primary Contact Person
    primaryContact: {
      fullName: { type: String, required: true },
      designation: { type: String },
      mobileNumber: { type: String, required: true },
      whatsappNumber: { type: String },
      emailId: { type: String, required: requiredUnlessLead, lowercase: true }
    },

    // Section 4 – Secondary Contact Person
    secondaryContact: {
      fullName: { type: String },
      designation: { type: String },
      contactNumber: { type: String },
      emailId: { type: String, lowercase: true }
    },

    // Section 5 – Product / Service Category
    productCategories: { type: [String], default: [] },

    // Section 6 – Stall Requirement
    stallRequirement: {
      preferredStallType: { type: String }, // Shell Scheme, Bare Space, etc.
      stallSize: { type: String }, // 9 sqm, 18 sqm, etc.
      cornerStallRequired: { type: String, enum: ['Yes', 'No'], default: 'No' },
      preferredHallNumber: { type: String },
      preferredStallLocation: { type: String, enum: ['One Side Open', 'Two Side Open', 'Three Side Open', ''], default: '' },
      countryPavilionParticipation: { type: String, enum: ['Yes', 'No'], default: 'No' }
    },

    // Section 7 – Sponsorship Interest
    sponsorship: {
      interested: { type: String, enum: ['Yes', 'No'], default: 'No' },
      preferredType: { type: String }
    },

    // Section 8 – Business Profile
    businessProfile: {
      companyProfileShort: { type: String },
      keyProductsServices: { type: String },
      exportCountries: { type: String },
      existingMajorClients: { type: String },
      certifications: { type: [String], default: [] }
    },

    // Section 9 – B2B Meeting Interest
    b2bInterest: {
      interested: { type: String, enum: ['Yes', 'No'], default: 'No' },
      lookingFor: { type: [String], default: [] }
    },

    // Section 10 – Travel Support
    travelSupport: {
      visaInvitation: { type: String, enum: ['Yes', 'No'], default: 'No' },
      hotelBooking: { type: String, enum: ['Yes', 'No'], default: 'No' },
      airportPickup: { type: String, enum: ['Yes', 'No'], default: 'No' },
      translatorSupport: { type: String, enum: ['Yes', 'No'], default: 'No' },
      arrivalDate: { type: Date },
      departureDate: { type: Date }
    },

    // Section 11 – Billing & Payment Details
    billingDetails: {
      billingName: { type: String },
      billingAddress: { type: String },
      accountsContactPerson: { type: String },
      accountsEmail: { type: String },
      accountsMobileNumber: { type: String },
      invoiceRequired: { type: String, enum: ['Yes', 'No'], default: 'No' },
      paymentMode: { type: String },
      bookingAmountPaid: { type: String },
      utrTransactionId: { type: String }
    },

    // Section 12 – Document Upload (Paths)
    documents: {
      companyRegistrationCertificate: { type: String },
      taxRegistrationCertificate: { type: String },
      passportCopy: { type: String },
      productCatalogue: { type: String },
      companyBrochure: { type: String },
      logo: { type: String },
      visitingCard: { type: String },
      productCertifications: { type: String },
      previousParticipationProof: { type: String },
      paymentScreenshot: { type: String }
    },

    // Section 13 – Verification (Internal)
    verification: {
      emailVerified: { type: Boolean, default: false },
      mobileOtpVerified: { type: Boolean, default: false },
      taxRegistrationVerified: { type: Boolean, default: false },
      passportVerified: { type: Boolean, default: false },
      adminApprovalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
    },

    // Section 14 – Declaration
    declarations: {
      infoAccurate: { type: Boolean, default: false },
      agreeTerms: { type: Boolean, default: false },
      acceptCancellationPolicy: { type: Boolean, default: false },
      acceptPrivacyPolicy: { type: Boolean, default: false },
      agreeParticipationRules: { type: Boolean, default: false },
      digitalSignature: { type: String }
    },

    // VIP Hosted Exhibitor Program
    vipProgram: {
      interested: { type: String, enum: ['Yes', 'No'], default: 'No' }
    },

    qrCode: { type: String },
    registrationId: { type: String, unique: true, sparse: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InternationalBuyer", internationalBuyerSchema);
