const mongoose = require('mongoose');

const heroBackgroundSchema = new mongoose.Schema({
    pageName: { type: String, required: true },
    backgroundImage: { type: String, required: true },
    imageAltText: { type: String },
    subtitle: { type: String },
    subtitleFontSize: { type: String, default: '12' },
    title: { type: String },
    titleFontSize: { type: String, default: '45' },
    title2: { type: String },
    title2FontSize: { type: String, default: '45' },
    heading: { type: String },
    shortDescription: { type: String },
    descriptionFontSize: { type: String, default: '16' },
    button1Text: { type: String },
    button1Link: { type: String },
    button2Text: { type: String },
    button2Link: { type: String },
    infoBar1: { type: String },
    infoBar2: { type: String },
    infoBar3: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('HeroBackground', heroBackgroundSchema);
