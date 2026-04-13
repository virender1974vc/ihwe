const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const CorporateVisitorSchema = new mongoose.Schema(
  {
    registrationId: { type: String, unique: true },
    registrationFor: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    designation: { type: String },
    companyName: { type: String },
    companyWebsite: { type: String },
    industrySector: { type: String },
    companySize: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    b2bMeeting: { type: String },
    whatsappUpdates: { type: String },
    specificRequirement: { type: String },
    subscribe: { type: Boolean, default: false },
    purposeOfVisit: [{ type: String }],
    areaOfInterest: [{ type: String }],
    status: { type: String, default: "New Reg." },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("CorporateVisitor", CorporateVisitorSchema);
