const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, default: '#23471d' }
});

const ePromotionContentSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Promotion' },
    title: { type: String, default: 'Boost Your Brand Before & During the Expo!' },
    highlightText: { type: String, default: 'During the Expo!' },
    shortDescription: { type: String, default: '' },
    cards: [cardSchema],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EPromotionContent', ePromotionContentSchema);
