const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const ContactSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  surname: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  alternate: { type: String, default: "" },
});

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    category: { type: String, required: true },
    businessNature: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    website: { type: String, required: true },
    landline: { type: String, default: "" },
    email: { type: String, required: true },
    dataSource: { type: String, required: true },
    eventName: { type: String, required: true },
    reminder: { type: Date, required: true },
    companyStatus: { type: String, required: true, default: "New Lead" },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    forwardTo: { type: String, required: true },
    contacts: [ContactSchema],
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("Company", CompanySchema);
