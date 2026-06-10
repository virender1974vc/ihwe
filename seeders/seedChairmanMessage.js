const mongoose = require('mongoose');
const ChairmanMessage = require('./models/ChairmanMessage');
require('dotenv').config();

const seedChairmanMessage = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Chairman Message seed');

        // Clear existing collection
        await ChairmanMessage.deleteMany({});
        console.log('Cleared existing Chairman Message collection.');

        const defaultData = {
            title: "Chairman's Message",
            heading: "Leading Together for a Healthier Tomorrow",
            description: "At IHWE Expo 2026, our Advisory Board plays a pivotal role in driving our mission forward. Their expertise, global perspective, and commitment to innovation guide us in creating a world-class platform that empowers the health and wellness ecosystem.",
            signatureName: "Vijay Sharma",
            chairmanName: "Mr. Vijay Sharma",
            chairmanDesignation: "Chairman, IHWE Expo 2026",
            photo: "/advisory/vijay.png",
            visionText: "A global platform for collaboration, innovation and impact in health & wellness."
        };

        const doc = new ChairmanMessage(defaultData);
        await doc.save();

        console.log('Chairman Message seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Chairman Message seed error:', err.message);
        process.exit(1);
    }
};

seedChairmanMessage();
