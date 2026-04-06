const mongoose = require('mongoose');

const FAQItemSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    order: { type: Number, default: 0 },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now }
});

const FAQSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Support & Info' },
    heading: { type: String, default: 'Frequently Asked Questions' },
    highlightText: { type: String, default: 'Questions' },
    description: { type: String, default: 'Find answers to common inquiries about the 9th International Health & Wellness Expo 2026.' },
    defaultImage: { type: String, default: '' },
    defaultImageAlt: { type: String, default: '' },
    items: [FAQItemSchema],
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });


module.exports = mongoose.model('FAQ', FAQSchema);
