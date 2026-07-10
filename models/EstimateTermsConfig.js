const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const estimateTermsConfigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Estimate Terms & Payment Conditions",
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["performa", "tax-invoice", "delivery-challan"],
      default: "performa",
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: "Performa",
      trim: true,
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    paymentConditions: {
      type: [String],
      default: [],
    },
    deliveryNotes: {
      type: [String],
      default: [],
    },
    specialRemark: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    updatedBy: {
      type: String,
      default: "System",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("EstimateTermsConfig", estimateTermsConfigSchema);
