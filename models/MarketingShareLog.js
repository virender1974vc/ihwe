const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const marketingShareLogSchema = new mongoose.Schema(
  {
    cmpny_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmEvent",
      default: null,
    },
    clientName: { type: String },
    clientMobile: { type: String },
    clientEmail: { type: String },
    materials: [
      {
        material_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MarketingMaterial",
        },
        title: String,
        category: String,
      },
    ],
    sentVia: {
      type: String,
      enum: ["Email", "WhatsApp", "Link"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Sent", "Viewed", "Downloaded"],
      default: "Sent",
    },
    sentBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

marketingShareLogSchema.index({ eventId: 1, createdAt: -1 });

module.exports = secondaryDB.model("MarketingShareLog", marketingShareLogSchema);
