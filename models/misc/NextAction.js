const mongoose = require("mongoose");
const { secondaryDB } = require('../../config/secondaryDb');

const nextActionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    updated_by: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

module.exports = secondaryDB.model("NextAction", nextActionSchema);
