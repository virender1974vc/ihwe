const mongoose = require('mongoose');

const ReasonCardSchema = new mongoose.Schema({
    icon: { type: String, default: 'Users' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    buttonName: { type: String, default: 'Learn More' },
    buttonLink: { type: String, default: '/visitor-registration' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    accent: { type: String, default: '#23471d' }
});

const WhyVisitSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Empower Your Journey' },
    heading: { type: String, default: 'Discover Why You Should Join Us' },
    highlightText: { type: String, default: 'Join Us' },
    shortDescription: { type: String, default: 'Join IHWE 2026 to experience the latest innovations and build lasting connections in the healthcare and wellness sector. okh!' },
    reasons: [ReasonCardSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhyVisit', WhyVisitSchema);
