const mongoose = require("mongoose");

const advisoryNominationSchema = new mongoose.Schema(
  {
    // Nominee Information
    fullName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    linkedin: { type: String, trim: true },

    // Nominee's Expertise & Background
    areasOfExpertise: { type: String, required: true },
    yearsOfExperience: { type: String, required: true },
    professionalSummary: { type: String, required: true },

    // Nomination Details
    whyRecommend: { type: String, required: true },
    contribution: { type: String, required: true },

    // Nominator Information
    nominatorName: { type: String, required: true, trim: true },
    nominatorDesignation: { type: String, required: true, trim: true },
    nominatorOrg: { type: String, required: true, trim: true },
    nominatorEmail: { type: String, required: true, trim: true, lowercase: true },
    nominatorPhone: { type: String, required: true, trim: true },
    relationship: { type: String, required: true },

    // Additional Information
    cvPath: { type: String },
    
    // Status & Verification
    registrationId: { type: String, unique: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'], 
      default: 'Pending' 
    },
    otpVerifiedEmail: { type: Boolean, default: false },
    otpVerifiedMobile: { type: Boolean, default: false },
    nominatorOtpVerifiedEmail: { type: Boolean, default: false },
    nominatorOtpVerifiedMobile: { type: Boolean, default: false },
    
  },
  { timestamps: true }
);

// Generate Registration ID before saving
advisoryNominationSchema.pre('save', async function() {
  if (!this.registrationId) {
    const count = await mongoose.model('AdvisoryNomination').countDocuments();
    this.registrationId = `ADV-${(count + 1).toString().padStart(4, '0')}`;
  }
});

module.exports = mongoose.model("AdvisoryNomination", advisoryNominationSchema);
