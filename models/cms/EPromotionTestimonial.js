const mongoose = require('mongoose');

const ePromotionTestimonialSchema = new mongoose.Schema({
    text: { type: String, required: true },
    name: { type: String, required: true }, // e.g. "Marketing Partner", "Exhibitor, IHWE 2025"
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('EPromotionTestimonial', ePromotionTestimonialSchema);
