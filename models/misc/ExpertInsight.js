const mongoose = require('mongoose');

const expertInsightSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    organization: { type: String, required: true }, // Added for UI parity
    image: { type: String, required: true },
    insight: { type: String, required: true },
    linkedArticleSlug: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ExpertInsight', expertInsightSchema);
