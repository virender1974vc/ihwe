const mongoose = require('mongoose');

const ePromotionEnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EPromotionEnquiry', ePromotionEnquirySchema);
