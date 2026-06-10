const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
    heading: {
        type: String,
        default: "About The Expo"
    },
    subheading: {
        type: String,
        default: "A Global Platform for Healthcare Excellence"
    },
    highlightedWord: {
        type: String,
        default: "Healthcare Excellence"
    },
    description: {
        type: String,
        default: "The International Health & Wellness Expo stands as a premier global gathering where healthcare leaders, innovators, and visionaries converge to shape the future of medical science. From advanced diagnostics to AI-driven solutions and wellness technologies, the expo fosters meaningful dialogue and transformative partnerships."
    },
    vision: {
        type: String,
        default: "To become the world's most influential healthcare exhibition platform, uniting medical pioneers, researchers, and global innovators under one transformative ecosystem."
    },
    mission: {
        type: String,
        default: "Empowering healthcare leaders with breakthrough technologies, fostering cross-border collaboration, and accelerating advancements in patient-centered care."
    },
    image1: {
        type: String,
        default: ""
    },
    image1Alt: {
        type: String,
        default: ""
    },
    image2: {
        type: String,
        default: ""
    },
    image2Alt: {
        type: String,
        default: ""
    },
    image3: {
        type: String,
        default: ""
    },
    image3Alt: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
