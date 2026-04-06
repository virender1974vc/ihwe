const mongoose = require('mongoose');

const ServiceCardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'ShieldCheck' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    accent: { type: String, default: '#23471d' },
    buttonText: { type: String, default: 'Explore Zone' },
    buttonUrl: { type: String, default: '#' },
    order: { type: Number, default: 0 },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now }
});

const FeaturedServicesSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Specialized Pavilions' },
    heading: { type: String, default: 'Focused Industry Zones for Business' },
    highlightText: { type: String, default: 'Industry Zones' },
    description: { type: String, default: 'Navigating the future of healthcare through dedicated specialized zones, connecting buyers with the right global innovators.' },
    mainButtonText: { type: String, default: 'Exhibit At India Health 2026' },
    mainButtonUrl: { type: String, default: '/book-a-stand' },
    mainSubText: { type: String, default: 'Join 2,500+ exhibiting brands from over 25 countries' },
    cards: [ServiceCardSchema],
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('FeaturedServices', FeaturedServicesSchema);
