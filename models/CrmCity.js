const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmCitySchema = new mongoose.Schema(
  {
    cityCode: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    stateCode: { type: Number, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }, // createdAt और updatedAt अपने आप बनेंगे
);

module.exports = secondaryDB.model("CrmCity", CrmCitySchema);
