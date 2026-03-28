const mongoose = require("mongoose");

const buyerRegistrationSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    companyWebsite: { type: String, trim: true },
    yearsInBusiness: { type: String, trim: true },
    annualImportVolume: { type: String, trim: true },
    mainMarketsServed: { type: String, trim: true },
    companyTypes: { type: [String], default: [] },
    contactPerson: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    interestedCategories: { type: [String], default: [] },
    targetPriceRange: { type: String, trim: true },
    preferredMeetingType: { type: String, required: true },
    specificExhibitors: { type: String, trim: true },
    confirmed: { type: Boolean, default: false },
    registrationFee: { type: String, default: "₹0" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BuyerRegistration", buyerRegistrationSchema);
