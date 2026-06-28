const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const ContactSchema = new mongoose.Schema({
  title: { type: String },
  firstName: { type: String },
  surname: { type: String },
  designation: { type: String },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  alternate: { type: String, default: "" },
  photo: { type: String, default: "" },
});

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    category: { type: String },
    businessNature: { type: String },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    clientType: { type: String },
    pincode: { type: String },
    website: { type: String },
    landline: { type: String, default: "" },
    email: { type: String, required: true },
    dataSource: { type: String },
    socialMediaType: { type: String },
    referralName: { type: String },
    referralMobile: { type: String },
    eventName: { type: String },
    reminder: { type: Date },
    companyStatus: { type: String, default: "New Lead" },
    added_by: { type: String, trim: true },
    udyamNumber: { type: String },
    gstNumber: { type: String },
    exhibitorCategory: { type: String },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    forwardTo: { type: String },
    followUpDate: { type: Date },
    companyLogo: { type: String },
    companyDescription: { type: String },
    exhibitorRegistrationId: { type: String, default: null },
    contacts: [ContactSchema],
  },
  { timestamps: true },
);

// Indexes for performance optimization
CompanySchema.index({ createdAt: -1 });
CompanySchema.index({ companyStatus: 1, createdAt: -1 });
CompanySchema.index({ "contacts.mobile": 1 });
CompanySchema.index({ email: 1 });
CompanySchema.index({ companyName: 1 });

module.exports = secondaryDB.model("Company", CompanySchema);
