const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    emailId: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    referralBy: {
      type: String,
      trim: true,
    },
    handleBy: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    estStallSize: {
      type: String,
      trim: true,
    },
    estValue: {
      type: Number,
      default: 0,
    },
    leadSource: {
      type: String,
      trim: true,
    },
    conversionStatus: {
      type: String,
      enum: ["Open", "Contacted", "In Discussion", "Proposal Sent", "Under Negotiation", "Stall Booked", "Payment Pending", "Converted", "Lost", "N/A"],
      default: "Open",
    },
    referralBonus: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", ReferralSchema);
