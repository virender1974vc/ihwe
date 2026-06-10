const mongoose = require('mongoose');

const TestimonialCardSchema = new mongoose.Schema({
    image: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    quote: { type: String, required: true },
    order: { type: Number, default: 0 },
    companyName1: { type: String, required: true },
    companyName2: { type: String, default: '' },
    location: { type: String, required: true },
    updatedBy: { type: String, default: 'System' },
    updatedAt: { type: Date, default: Date.now }
});

const ExhibitorTestimonialsSchema = new mongoose.Schema({
    heading: { type: String, default: 'What Our Exhibitors Say' },
    cards: [TestimonialCardSchema],
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('ExhibitorTestimonials', ExhibitorTestimonialsSchema);
