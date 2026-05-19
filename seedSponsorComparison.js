const mongoose = require('mongoose');
const SponsorComparison = require('./models/SponsorComparison');
require('dotenv').config();

const seedSponsorComparison = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Sponsor Comparison seed');

        // Clear existing dynamic sponsor comparison collection
        await SponsorComparison.deleteMany({});
        console.log('Cleared existing Sponsor Comparison collection.');

        const defaultCards = [
            {
                title: "TITLE SPONSOR",
                desc: "Maximum visibility & brand exclusivity",
                image: "/images/partnership/trophy.png",
                color: "blue",
            },
            {
                title: "POWERED BY SPONSOR",
                desc: "Align your brand as the power behind IHWE",
                image: "/images/partnership/saver.png",
                color: "green",
            },
            {
                title: "ASSOCIATE SPONSOR",
                desc: "High-impact visibility & brand recognition",
                image: "/images/partnership/associate.png",
                color: "blue",
            },
            {
                title: "CONFERENCE SPONSOR",
                desc: "Brand association with knowledge sessions",
                image: "/images/partnership/speaker.png",
                color: "green",
            },
            {
                title: "REGISTRATION SPONSOR",
                desc: "High brand recall at every entry point",
                image: "/images/partnership/reg.png",
                color: "blue",
            },
            {
                title: "LANYARD / BADGE SPONSOR",
                desc: "Put your brand around every neck",
                image: "/images/partnership/lanyard.png",
                color: "green",
            },
            {
                title: "WELLNESS ZONE SPONSOR",
                desc: "Showcase your brand in the wellness experience zone",
                image: "/images/partnership/wellness.png",
                color: "blue",
            },
            {
                title: "DIGITAL PROMOTION PARTNER",
                desc: "Expand your reach across digital platforms",
                image: "/images/partnership/digital.png",
                color: "green",
            },
        ];

        const defaultComparison = [
            {
                benefit: "Logo on all event branding",
                values: ["✔", "✔", "✔", "✔", "✔", "✔", "✔", "✔"],
            },
            {
                benefit: "Keynote / Speaking Opportunity",
                values: ["30 mins", "20 mins", "—", "—", "—", "—", "—", "—"],
            },
            {
                benefit: "Exhibition Space",
                values: ["12 sqm", "9 sqm", "6 sqm", "—", "—", "—", "2 sqm", "—"],
            },
            {
                benefit: "Ad in Souvenir",
                values: ["Full Page", "Half Page", "Half Page", "Listing", "Listing", "Listing", "Listing", "—"],
            },
            {
                benefit: "Press Release Mentions",
                values: ["All", "Featured", "Featured", "—", "—", "—", "—", "—"],
            },
            {
                benefit: "Complimentary Delegate Passes",
                values: ["12", "8", "6", "4", "4", "2", "2", "—"],
            },
            {
                benefit: "VIP Lounge Access",
                values: ["✔", "✔", "✔", "✔", "✔", "✔", "✔", "—"],
            },
        ];

        const doc = new SponsorComparison({
            cards: defaultCards,
            comparisonData: defaultComparison
        });
        await doc.save();

        console.log('Sponsor Comparison seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Sponsor Comparison seed error:', err.message);
        process.exit(1);
    }
};

seedSponsorComparison();
