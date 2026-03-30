const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmStateSchema = new mongoose.Schema(
  {
    stateCode: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    countryCode: { type: Number, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }, // createdAt और updatedAt automatically add होंगे
);

module.exports = secondaryDB.model("CrmState", CrmStateSchema);
