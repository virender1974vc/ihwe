const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const sellerSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    durationDays: {
      type: Number,
      required: true,
      default: 365, // 1 year
    },
    features: [{
      key: { type: String, required: true }, // e.g., 'bsm_marketing', 'export_inquiry', 'lead_access'
      label: { type: String, required: true }, // e.g., 'BSM Marketing Access'
      enabled: { type: Boolean, default: true },
    }],
    maxLeads: {
      type: Number,
      default: 0,
    },
    maxExportInquiries: {
      type: Number,
      default: 0,
    },
    maxServiceRequests: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    updatedBy: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "added", updatedAt: "updated" },
  }
);

module.exports = secondaryDB.model("SellerSubscriptionPlan", sellerSubscriptionPlanSchema);
