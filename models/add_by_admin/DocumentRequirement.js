const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const DocumentRequirementSchema = new mongoose.Schema(
  {
    document_name: { type: String, required: true },
    category: { 
        type: String, 
        required: true, 
        enum: ["MSME Related Documents", "General Documents"] 
    },
    order: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    showOnDashboard: { type: Boolean, default: false },
    added_by: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,   
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("DocumentRequirement", DocumentRequirementSchema);
