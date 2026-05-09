const mongoose = require('mongoose');

const ConferenceTestimonialCardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String },
    company: { type: String },
    initials: { type: String },
    feedback: { type: String, required: true },
    image: { type: String },
    rating: { type: Number, default: 5 },
    order: { type: Number, default: 0 }
});

const ConferenceTestimonialSchema = new mongoose.Schema({
    subheading: { type: String, default: 'VOICES FROM' },
    heading: { type: String, default: 'INDUSTRY LEADERS' },
    highlightText: { type: String, default: 'LEADERS' },
    description: { type: String, default: 'Voices from the leaders of the industry.' },
    cards: [ConferenceTestimonialCardSchema]
}, { timestamps: true });

module.exports = mongoose.model('ConferenceTestimonial', ConferenceTestimonialSchema);
