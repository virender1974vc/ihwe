const mongoose = require('mongoose');

const ePromotionAddonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true }, // Store as string (e.g. "₹ 15,000") for maximum flexibility
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('EPromotionAddon', ePromotionAddonSchema);
