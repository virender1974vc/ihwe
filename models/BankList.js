const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const BankListSchema = new mongoose.Schema(
  {
    bankname: { type: String, required: true },
    bankbranch: { type: String, required: true },
    accountno: { type: String, required: true },
    ifsccode: { type: String, required: true },
    status: { type: String, required: true },

    added_by: { type: String },
    added: { type: Date, required: true },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("BankList", BankListSchema);
