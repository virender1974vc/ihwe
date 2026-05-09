const mongoose = require('mongoose');
const ConferenceTrack = require('../models/ConferenceTrack');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const tracks = [
    {
        day: "DAY 1",
        date: "21 AUGUST 2026",
        title: "HEALTHCARE INNOVATION SUMMIT",
        sessions: [
            "Smart Hospitals & Digital Transformation",
            "Medical Devices & Innovation",
            "Diagnostics & Precision Medicine",
            "Infrastructure & Investment"
        ],
        iconName: "Lightbulb",
        accentColor: "#4E9F3D",
        badgeColor: "bg-[#1A4D2E]",
        link: "/conference/day-1",
        order: 1
    },
    {
        day: "DAY 2",
        date: "22 AUGUST 2026",
        title: "GLOBAL WELLNESS LEADERSHIP FORUM",
        sessions: [
            "Wellness Economy & Global Opportunities",
            "Ayurveda, AYUSH & Holistic Healing",
            "Fitness, Preventive Health & Lifestyle Medicine",
            "Beauty, Personal Care & Wellness Innovation"
        ],
        iconName: "Sprout",
        accentColor: "#E67E22",
        badgeColor: "bg-[#92400E]",
        link: "/conference/day-2",
        order: 2
    },
    {
        day: "DAY 3",
        date: "23 AUGUST 2026",
        title: "WELLNESS & AYUSH LEADERSHIP FORUM",
        sessions: [
            "Ayurveda & Traditional Wisdom",
            "Nutrition, Diet & Lifestyle",
            "Yoga, Mental Health & Wellness",
            "Herbal Industry & Natural Products"
        ],
        iconName: "ShieldPlus",
        accentColor: "#7C3AED",
        badgeColor: "bg-[#581C87]",
        link: "/conference/day-3",
        order: 3
    }
];

const seedTracks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log('✅ Connected to MongoDB');

        await ConferenceTrack.deleteMany({});
        console.log('🗑️ Deleted existing tracks');

        await ConferenceTrack.insertMany(tracks);
        console.log('🌱 Seeded conference tracks');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding tracks:', error);
        process.exit(1);
    }
};

seedTracks();
