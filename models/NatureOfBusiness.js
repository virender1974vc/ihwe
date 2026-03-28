const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const NatureOfBusinessSchema = new mongoose.Schema(
  {
    nature_id: { type: Number, required: true },
    nature_name: { type: String, required: true },
    nature_status: { type: String, default: "active" },
    added: { type: Date, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("NatureOfBusiness", NatureOfBusinessSchema);
