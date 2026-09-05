const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const blankToNull = (value) =>
  typeof value === "string" && value.trim() === "" ? null : value;
const ContactSchema = new mongoose.Schema({
  title: { type: String },
  firstName: { type: String },
  surname: { type: String },
  name: { type: String },
  designation: { type: String },
  department: { type: String, default: "" },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  alternate: { type: String, default: "" },
  photo: { type: String, default: "" },
  photoUrl: { type: String, default: "" },
  isPrimary: { type: Boolean, default: false },
  roleAtExhibition: { type: String, default: "" },
  passes: {
    exhibitor: { type: Boolean, default: false },
    vehicle: { type: Boolean, default: false },
    service: { type: Boolean, default: false },
    visitor: { type: Boolean, default: false }
  },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' }
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
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null, set: blankToNull },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent" }],
    eventAssignments: [{
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent", set: blankToNull },
      forwardTo: { type: String },
      status: { type: String, default: "New Lead" },
      dataSource: { type: String, default: "" },
      socialMediaType: { type: String, default: "" },
      referralName: { type: String, default: "" },
      referralMobile: { type: String, default: "" },
      reminder: { type: Date, default: null },
      followUpDate: { type: Date, default: null },
      exhibitorRegistrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorRegistration", default: null, set: blankToNull },
      registrationEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, set: blankToNull },
      lastRemark: { type: String, default: "" },
      convertedAt: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    reminder: { type: Date },
    companyStatus: { type: String, default: "New Lead" },
    added_by: { type: String, trim: true },
    udyamNumber: { type: String },
    udyamCertificateUrl: { type: String },
    gstNumber: { type: String },
    panNo: { type: String },
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
CompanySchema.index({ eventId: 1 });
CompanySchema.index({ events: 1 });
CompanySchema.index({ "eventAssignments.eventId": 1, "eventAssignments.status": 1 });

module.exports = secondaryDB.model("Company", CompanySchema);
