const mongoose = require("mongoose");

const IndividualLeadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    profession: { type: String },
    age: { type: Number },
    mobileNumber: { type: String, required: true },
    emailAddress: { type: String },
    alternateNo: { type: String },
    landlineNo: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    address: { type: String },
    pincode: { type: String },
    dataSource: { type: String },
    enquiryFor: { type: String },
    status: {
      type: String,
      enum: ["Active", "Pending", "Completed", "Inactive"],
      default: "Active",
    },
    notes: { type: String },
    contacts: [
      {
        name: String,
        relation: String,
        phone: String,
        email: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("IndividualLead", IndividualLeadSchema);
