const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvisoryMember = require('../models/AdvisoryMember');

const members = [
    {
        name: "Dr. Randeep Guleria",
        role: "Chairman",
        organization: "IHWE Expo 2026",
        image: "/advisory/chef1.png",
        imageAlt: "Dr. Randeep Guleria",
        linkedin: "https://linkedin.com/in/randeep-guleria",
        country: "India"
    },
    {
        name: "Dr. Naresh Trehan",
        role: "Advisory Member",
        organization: "Medanta - The Medicity",
        image: "/advisory/1.png",
        imageAlt: "Dr. Naresh Trehan",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Devi Shetty",
        role: "Advisory Member",
        organization: "Narayana Health",
        image: "/advisory/2.png",
        imageAlt: "Dr. Devi Shetty",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Prathap C. Reddy",
        role: "Advisory Member",
        organization: "Apollo Hospitals",
        image: "/advisory/3.png",
        imageAlt: "Dr. Prathap C. Reddy",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Kiran Mazumdar-Shaw",
        role: "Advisory Member",
        organization: "Biocon Limited",
        image: "/advisory/4.png",
        imageAlt: "Dr. Kiran Mazumdar-Shaw",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. S. K. Sarin",
        role: "Advisory Member",
        organization: "ILBS Delhi",
        image: "/advisory/5.png",
        imageAlt: "Dr. S. K. Sarin",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Arvinder Singh Soin",
        role: "Advisory Member",
        organization: "Medanta Liver Institute",
        image: "/advisory/1.png",
        imageAlt: "Dr. Arvinder Singh Soin",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Ambrish Mithal",
        role: "Advisory Member",
        organization: "Max Healthcare",
        image: "/advisory/2.png",
        imageAlt: "Dr. Ambrish Mithal",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Ashok Seth",
        role: "Advisory Member",
        organization: "Fortis Escorts Heart Institute",
        image: "/advisory/3.png",
        imageAlt: "Dr. Ashok Seth",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Sandeep Guleria",
        role: "Advisory Member",
        organization: "Apollo Hospitals",
        image: "/advisory/4.png",
        imageAlt: "Dr. Sandeep Guleria",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Rajesh Parikh",
        role: "Advisory Member",
        organization: "Jaslok Hospital",
        image: "/advisory/5.png",
        imageAlt: "Dr. Rajesh Parikh",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Zarir Udwadia",
        role: "Advisory Member",
        organization: "P.D. Hinduja Hospital",
        image: "/advisory/1.png",
        imageAlt: "Dr. Zarir Udwadia",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Shashank Joshi",
        role: "Advisory Member",
        organization: "Lilavati Hospital",
        image: "/advisory/2.png",
        imageAlt: "Dr. Shashank Joshi",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Balram Bhargava",
        role: "Advisory Member",
        organization: "AIIMS Delhi",
        image: "/advisory/3.png",
        imageAlt: "Dr. Balram Bhargava",
        linkedin: "https://linkedin.com",
        country: "India"
    },
    {
        name: "Dr. Soumya Swaminathan",
        role: "Advisory Member",
        organization: "WHO (Former Chief Scientist)",
        image: "/advisory/4.png",
        imageAlt: "Dr. Soumya Swaminathan",
        linkedin: "https://linkedin.com",
        country: "India"
    }
];

const seedDB = async () => {
    try {
        if (!process.env.MONGO_URI_MAIN) {
            throw new Error("MONGO_URI_MAIN is not defined in environment variables");
        }
        await mongoose.connect(process.env.MONGO_URI_MAIN);
        console.log("✅ Connected to MongoDB");

        // Clear existing members
        await AdvisoryMember.deleteMany({});
        console.log("🗑️ Cleared existing advisory members");

        // Insert new members
        await AdvisoryMember.insertMany(members);
        console.log(`🚀 Successfully seeded ${members.length} advisory members`);

        mongoose.connection.close();
        console.log("👋 Connection closed");
    } catch (error) {
        console.error("❌ Seeding error:", error);
        process.exit(1);
    }
};

seedDB();
