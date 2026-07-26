const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const NatureOfBusinessSchema = new mongoose.Schema(
  {
    nature_id: { type: Number, required: true },
    nature_name: { type: String, required: true },
    short_code: { type: String, default: "" },
    description: { type: String, default: "" },
    display_order: { type: Number, default: 0 },
    nature_status: { type: String, default: "active" },
    applicable_for: { type: [String], default: [] },
    allowed_operations: { type: [String], default: [] },
    remarks: { type: String, default: "" },
    added: { type: Date },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("NatureOfBusiness", NatureOfBusinessSchema);
