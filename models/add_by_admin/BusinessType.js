const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const BusinessTypeSchema = new mongoose.Schema(
  {
    nature_id: { type: String},
    business_type: { type: String, required: true },
    status: { type: String, default: "Active" },
    added_by: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,   
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("BusinessType", BusinessTypeSchema);
