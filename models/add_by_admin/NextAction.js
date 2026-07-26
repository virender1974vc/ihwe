const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const nextActionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    action_code: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    display_order: { type: Number, required: true, default: 1 },
    action_type: { type: String, required: true },
    follow_up_days: { type: Number, default: 1 },
    applicable_for: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    updated_by: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

module.exports = secondaryDB.model("NextAction", nextActionSchema);
