const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const BankOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, default: "active" },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    added: { type: Date, required: true },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("BankOption", BankOptionSchema);
