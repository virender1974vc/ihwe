const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmCountrySchema = new mongoose.Schema(
  {
    countryCode: { type: Number, required: true, unique: true },
    sortName: { type: String, required: true },
    name: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }, // createdAt और updatedAt अपने आप बनेंगे
);

module.exports = secondaryDB.model("CrmCountry", CrmCountrySchema);
