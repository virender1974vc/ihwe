const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const VisitorOTPSchema = new mongoose.Schema({
  credentials: { type: String, required: true }, // Email or Mobile
  otp: { type: String, required: true },
  visitorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  visitorType: { type: String, enum: ['corporate', 'general'], required: true },
  expiresAt: { type: Date, required: true, index: { expires: '5m' } } // 5 minutes expiry
}, { timestamps: true });

module.exports = secondaryDB.model("VisitorOTP", VisitorOTPSchema);
