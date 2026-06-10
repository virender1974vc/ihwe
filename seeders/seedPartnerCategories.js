const mongoose = require('mongoose');
const PartnerCategories = require('./models/PartnerCategories');
require('dotenv').config();

const seedPartnerCategories = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Partner Categories & Benefits seed');

        // Clear existing dynamic partner Categories collection
        await PartnerCategories.deleteMany({});
        console.log('Cleared existing Partner Categories collection.');

        const defaultCards = [
            {
                no: "01",
                title: "Hotel & Stay Partner",
                image: "/images/partnership/3.png",
                color: "#619941",
                link: "/hotel-stay-partner",
                icon: "/images/partnership/bed.png",
                points: [
                    "Brand visibility on official platforms",
                    "Direct access to exhibitors & delegates",
                    "Priority partner listing",
                    "Business inquiries & repeat bookings",
                    "Exclusive partner rates",
                ],
            },
            {
                no: "02",
                title: "Travel Partner",
                image: "/images/partnership/2.png",
                color: "#2f68c5",
                link: "/travel-partner",
                icon: "/images/partnership/aeroplan.png",
                points: [
                    "Featured as official travel partner",
                    "Exposure to global exhibitors & buyers",
                    "Lead generation opportunities",
                    "Association with premium event",
                    "Referral business opportunities",
                ],
            },
            {
                no: "03",
                title: "Stall Design & Fabrication",
                image: "/images/partnership/1.png",
                color: "#11a7b8",
                link: "/fabrication-partner",
                icon: "/images/partnership/home.png",
                points: [
                    "Official branding on event collaterals",
                    "High visibility at venue",
                    "Access to exhibitors for stall needs",
                    "Repeat business potential",
                    "Showcase portfolio to global brands",
                ],
            },
            {
                no: "04",
                title: "Logistics Partner",
                image: "/images/partnership/Logistics.png",
                color: "#7b43c9",
                link: "/logistic-partner",
                icon: "/images/partnership/delivery.png",
                points: [
                    "Listed as official logistics partner",
                    "International partner recognition",
                    "Continuous business opportunities",
                    "Access to exhibitors logistics needs",
                    "Long-term contracts",
                ],
            },
            {
                no: "05",
                title: "Printing & Branding",
                image: "/images/partnership/printing.png",
                color: "#ff7a00",
                link: "/printing-branding-partner",
                icon: "/images/partnership/print.png",
                points: [
                    "Branding across event materials",
                    "On-site branding opportunities",
                    "High footfall audience visibility",
                    "Year-round referrals",
                    "Association with globally recognized event",
                ],
            },
            {
                no: "06",
                title: "Hospitality Partner",
                image: "/images/partnership/hospitality.jpg",
                color: "#e93d8b",
                link: "/hospitality-partner",
                icon: "/images/partnership/bell.png",
                points: [
                    "Recognition as hospitality partner",
                    "Networking with delegates & exhibitors",
                    "Brand exposure at venue",
                    "Long-term collaboration opportunities",
                    "Enhance brand credibility",
                ],
            }
        ];

        const doc = new PartnerCategories({
            cards: defaultCards
        });
        await doc.save();

        console.log('Partner Categories & Benefits seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Partner Categories seed error:', err.message);
        process.exit(1);
    }
};

seedPartnerCategories();
