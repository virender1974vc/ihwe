const mongoose = require('mongoose');

const BenefitCardSchema = new mongoose.Schema({
    icon: { type: String, default: 'Rocket' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    buttonName: { type: String, default: 'Learn More' },
    buttonLink: { type: String, default: '#' },
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    accent: { type: String, default: '#23471d' }
});

const WhyExhibitSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Empower Your Business' },
    heading: { type: String, default: 'Drive Growth & Innovation' },
    highlightText: { type: String, default: 'Growth & Innovation' },
    shortDescription: { type: String, default: 'Join IHWE 2026 to connect with global innovators and access new market opportunities through our specialized exhibitor platforms and elite networking events.' },
    benefits: [BenefitCardSchema],
    // CTA Section
    ctaTitle: { type: String, default: 'Ready to Scale Your Brand?' },
    ctaHighlightText: { type: String, default: 'Scale Your Brand?' },
    ctaDescription: { type: String, default: 'Secure your premium space today and connect with thousands of decision-makers in the healthcare and wellness sector.' },
    ctaButton1Name: { type: String, default: 'Book Your Stand Now' },
    ctaButton1Link: { type: String, default: '/book-a-stall' },
    ctaButton2Name: { type: String, default: 'Register as Visitor' },
    ctaButton2Link: { type: String, default: '/visitor-registration' },
    ctaImage: { type: String, default: '' },
    ctaImageAlt: { type: String, default: 'Success at IHWE' },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhyExhibit', WhyExhibitSchema);
