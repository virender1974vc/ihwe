const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ArogyaCertificateConfig = require('./models/arogyaCertificateConfig');

dotenv.config();

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ihwe_db";

const seedData = {
    supportedByText: "SUPPORTED BY:",
    presentsText: "Presents",
    bodyTextPart1: "We extend our heartfelt gratitude to",
    recipientName: "DABUR INDIA LIMITED",
    bodyTextPart2: "for being a Valuable Speaker at the 18th",
    highlightText1: "Arogya Sangoshthi",
    bodyTextPart3: "Seminar & 9th Edition of",
    highlightText2: "International Health & Wellness",
    highlightText3: "Expo 2026",
    bodyTextPart4: ", organised by Namo Gange Trust, held from 21st August to 23rd August 2026",
    bodyTextPart5: "at Pragati Maidan, New Delhi, Bharat.",
    bodyTextPart6: "Your insightful session, valuable expertise, and inspiring contribution greatly enriched",
    bodyTextPart7: "the conference and benefited all participants.",
    bodyTextPart8: "We sincerely appreciate your time, dedication, and commitment to advancing health and wellness,",
    bodyTextPart9: "and look forward to your continued support in future initiatives.",
    founderName: "H.H. Shri Acharya Jagdish Ji",
    founderRole: "Founder",
    chairmanName: "Shri Vijay Sharma",
    chairmanRole: "Chairman",
    initiativesTitle: "Namo Gange Trust Initiatives",
    concurrentTitle: "CONCURRENT EVENTS",
    footerAddress: "Head Office: 12/52, Site-II, Loni Road Industrial Area, Mohan Nagar, Ghaziabad 201007, UP, Bharat",
    footerContact: "info@namogange.org | web: www.namogange.org",
    
    // We will leave the images empty in DB initially, so the frontend falls back to default imports
    // or the admin uploads them.
    supportedByLogo: "",
    mainLogo: "",
    titleLogo: "",
    certificateHeading: "",
    founderSignature: "",
    chairmanSignature: "",
    globalAwardLogo: "",
    initiativeLogos: Array.from({ length: 24 }, () => ""),
    concurrentLogos: Array.from({ length: 7 }, () => "")
};

const seedDatabase = async () => {
    try {
        await mongoose.connect(DB_URI, {
            
            
        });
        console.log('Connected to MongoDB');

        // Check if config already exists
        const existingConfig = await ArogyaCertificateConfig.findOne();
        if (existingConfig) {
            console.log('Arogya Certificate Config already exists. Resetting to default seed...');
            await ArogyaCertificateConfig.deleteMany({});
        }

        const config = new ArogyaCertificateConfig(seedData);
        await config.save();
        console.log('Arogya Certificate Config seeded successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding Arogya Certificate Config:', error);
        process.exit(1);
    }
};

seedDatabase();
