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
    eventName: { type: String },
    reminder: { type: Date },
    companyStatus: { type: String, default: "New Lead" },
    added_by: { type: String, trim: true },
    udyamNumber: { type: String },
    gstNumber: { type: String },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    forwardTo: { type: String },
    contacts: [ContactSchema],
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("Company", CompanySchema);
