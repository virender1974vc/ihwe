const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const GeneralVisitorSchema = new mongoose.Schema(
  {
    registrationId: { type: String, unique: true },
    registrationFor: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateNo: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String },
    companyName: { type: String },
    designation: { type: String },
    industrySector: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    purposeOfVisit: [{ type: String }],
    areaOfInterest: [{ type: String }],
    status: { type: String, default: "New Reg." },
    subscribe: { type: Boolean, default: false },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("GeneralVisitor", GeneralVisitorSchema);
