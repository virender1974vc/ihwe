const mongoose = require("mongoose");

const partnerRegistrationSchema = new mongoose.Schema(
  {
    // Company Information
    companyName: { type: String, required: true, trim: true },
    businessCategory: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    yearEstablished: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    msmeRegistration: { type: String, trim: true },

    // Contact Information
    fullName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    // Office Location
    officeAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },

    // Service Details
    selectedServices: { type: [String], default: [] },
    otherService: { type: String, trim: true },

    // Business Capacity & Experience
    experience: { type: String, required: true, trim: true },
    majorClients: { type: String, trim: true },
    canHandleInternational: { type: String, trim: true },
    operationalCities: { type: String, trim: true },

    // Partnership Interests
    partnershipInterests: { type: [String], default: [] },
    additionalInfo: { type: String, trim: true },

    // Declaration
    declaration: { type: Boolean, required: true },

    // Document Paths (Multer Uploaded)
    companyProfilePath: { type: String },
    gstCertificatePath: { type: String },
    panCardPath: { type: String },
    msmeCertificatePath: { type: String },
    portfolioPath: { type: String },
    visitingCardPath: { type: String },

    // Status & Identification
    registrationId: { type: String, unique: true },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Accepted", "Rejected"],
      default: "Pending",
    },
    otpVerifiedEmail: { type: Boolean, default: false },
    otpVerifiedMobile: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook to generate registrationId
partnerRegistrationSchema.pre("save", async function () {
  if (!this.registrationId) {
    const count = await mongoose.model("PartnerRegistration").countDocuments();
    this.registrationId = `PRT-${(count + 1).toString().padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("PartnerRegistration", partnerRegistrationSchema);
