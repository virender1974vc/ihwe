const mongoose = require("mongoose");

const CorporateLeadSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    category: { type: String },
    nature: { type: String },
    state: { type: String },
    city: { type: String },
    source: { type: String },
    enquiryFor: { type: String },
    status: {
      type: String,
      enum: ["active", "pending", "inactive"],
      default: "pending",
    },
    updatedStatus: {
      type: String,
      enum: [
        "New Enquiry",
        "Contacted",
        "Meeting Scheduled",
        "Proposal Sent",
        "Negotiation",
        "Closed Won",
        "Closed Lost",
        "On Hold",
      ],
      default: "New Enquiry",
    },
    updatedDetails: { type: String },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    tags: [{ type: String }],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CorporateLead", CorporateLeadSchema);
