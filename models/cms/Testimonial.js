const mongoose = require('mongoose');

const TestimonialCardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String },
    company: { type: String },
    initials: { type: String },
    feedback: { type: String, required: true },
    rating: { type: Number, default: 5 },
    order: { type: Number, default: 0 }
});

const TestimonialSchema = new mongoose.Schema({
    subheading: { type: String, default: 'Testimonials' },
    heading: { type: String, default: 'What Global Leaders Are Saying' },
    highlightText: { type: String, default: 'Are Saying' },
    description: { type: String, default: 'Voices of trust from healthcare innovators, clinical experts, and industry pioneers across the globe.' },
    cards: [TestimonialCardSchema]
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
