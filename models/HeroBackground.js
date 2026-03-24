const mongoose = require('mongoose');

const heroBackgroundSchema = new mongoose.Schema({
    pageName: { type: String, required: true },
    backgroundImage: { type: String, required: true },
    imageAltText: { type: String },
    title: { type: String },
    heading: { type: String },
    shortDescription: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('HeroBackground', heroBackgroundSchema);
