const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const LeadIndustrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
    added_by: { type: String, default: "System", trim: true },
    updated_by: { type: String, default: null, trim: true },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } }
);

module.exports = secondaryDB.model("LeadIndustry", LeadIndustrySchema);
