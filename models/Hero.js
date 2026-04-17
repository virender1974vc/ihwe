const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    image: { type: String, required: true },
    altText: { type: String },
    subtitle: { type: String, required: true },
    title: { type: String, required: true },
    titleFontSize: { type: String, default: '45' },
    description: { type: String, required: true },
    descriptionFontSize: { type: String, default: '16' },
    button1Name: { type: String, default: 'View Our Projects' },
    button1Url: { type: String, default: '/projects-list' },
    button2Name: { type: String, default: 'Get Free Consultation' },
    button2Url: { type: String, default: '/contact-list' },
    button3Name: { type: String, default: 'Attend Conference' },
    button3Url: { type: String, default: '/conference' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    schedule: {
        startDate: String,
        startTime: String,
        endDate: String,
        endTime: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hero', heroSchema);
