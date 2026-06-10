const mongoose = require('mongoose');

const GlobalPlatformSchema = new mongoose.Schema({
    subheading: {
        type: String,
        default: 'Global Platform'
    },
    title: {
        type: String,
        default: "India's Impactful Health & Wellness Stage"
    },
    highlightText: {
        type: String,
        default: 'Health & Wellness Stage'
    },
    descriptionHtml: {
        type: String,
        required: true,
        default: ''
    },
    points: {
        type: [String],
        default: [
            'Global Networking',
            'Innovation Hub',
            'Holistic Wellness',
            'B2B Opportunities'
        ]
    },
    tagline: {
        type: String,
        default: 'Our vision is to empower every individual with the knowledge of preventive healthcare and the tools for a sustainable, healthy future.'
    },
    images: [{
        url: { type: String, default: '' },
        altText: { type: String, default: '' }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GlobalPlatform', GlobalPlatformSchema);
