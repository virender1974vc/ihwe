const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
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
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Multi-event support: a company can be tagged into several events at once
    // (e.g. IHWE 2026 and Organic 2027) without duplicating the record.
    // `eventId` above stays as the "event this lead-row was created for" (legacy,
    // still used by per-event pages); `events` is the new assignable set shown
    // together in Master Data.
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent" }],
    // Who handles this company FOR A GIVEN EVENT. Kept separate from the flat
    // `forwardTo` below because a company can belong to several events with a
    // different person responsible for each — e.g. Vansh owns it for IHWE
    // Expo 2026 while Manish owns it for Organic Expo 2027 at the same time.
    // Assigning one event's person must never overwrite another event's entry.
    eventAssignments: [{
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent" },
      forwardTo: { type: String },
    }],
    reminder: { type: Date },
    companyStatus: { type: String, default: "New Lead" },
    added_by: { type: String, trim: true },
    udyamNumber: { type: String },
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

module.exports = secondaryDB.model("Company", CompanySchema);
