const mongoose = require('mongoose');

const PartnerCardSchema = new mongoose.Schema({
    no: { type: String }, // e.g. "01", "02"
    title: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, default: '#619941' },
    link: { type: String, default: '' },
    icon: { type: String, required: true },
    points: [{ type: String }] // bullet points representing partner benefits
});

const PartnerCategoriesSchema = new mongoose.Schema({
    cards: [PartnerCardSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PartnerCategories', PartnerCategoriesSchema);
