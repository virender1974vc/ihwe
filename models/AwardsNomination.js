const mongoose = require('mongoose');

const awardsNominationSchema = new mongoose.Schema({
  // Section 1: Applicant Details
  applicantType: {
    type: String,
    required: true,
    enum: ['Individual', 'Organization', 'Startup'],
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  contactPersonName: {
    type: String,
    required: true,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  website: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },

  // Section 2: Award Category
  awardCategory: {
    type: String,
    required: true,
    trim: true,
  },

  // Section 3: Profile Details
  briefProfile: {
    type: String,
    trim: true,
  },
  yearsOfExperience: {
    type: String,
    trim: true,
  },
  teamSize: {
    type: String,
    trim: true,
  },
  keyServices: {
    type: String,
    trim: true,
  },

  // Section 4: Achievements & Impact
  keyAchievements: {
    type: String,
    trim: true,
  },
  uniqueContribution: {
    type: String,
    trim: true,
  },
  impactCreated: {
    type: String,
    trim: true,
  },
  innovationUsed: {
    type: String,
    trim: true,
  },
  whyDeserve: {
    type: String,
    trim: true,
  },

  // Section 5: Supporting Documents (file paths)
  profileDeckUrl: { type: String, trim: true },
  certificationsUrl: { type: String, trim: true },
  imagesUrl: { type: String, trim: true },
  socialLinks: { type: String, trim: true },

  // Status Management
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
    default: 'Pending',
  },

  // Admin notes
  adminRemarks: {
    type: String,
    trim: true,
    default: '',
  },

  updated_by: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('AwardsNomination', awardsNominationSchema);
