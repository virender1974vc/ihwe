const mongoose = require('mongoose');
const EPromotionPackage = require('./models/e_promotion/EPromotionPackage');
require('dotenv').config();

const seedEPromotionPackages = async () => {
    try {
        // Use the same MONGO_URI_MAIN used in server.js
        const mongoUri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB for E-Promotion Packages seed');

        const initialPackages = [
            {
                title: "STARTER VISIBILITY PACKAGE",
                subtitle: "Build your presence and get notice online",
                price: 12000,
                gstText: "+18% GST",
                features: [
                    "Featured Listing on Website",
                    "Logo on Exhibitor Directory Page",
                    "1 Social Media Promotion (1 Post)",
                    "Event Updates Inclusion",
                    "Standard Listing in Emailer"
                ],
                backgroundImage: "/images/9.png",
                buttonText: "CHOOSE STARTER",
                textColor: "text-green-800",
                priceColor: "text-green-800",
                order: 1
            },
            {
                title: "GROWTH PROMOTION PACKAGE",
                subtitle: "Increase engagement and generate more leads",
                price: 24000,
                gstText: "+18% GST",
                features: [
                    "Everything in Starter Package",
                    "3 Social Media Promotions (3 Posts)",
                    "Featured Inclusion in 1 Email Campaign",
                    "Homepage Logo Highlight",
                    "WhatsApp Broadcast Inclusion",
                    "Event Updates & News Feature"
                ],
                backgroundImage: "/images/10.png",
                buttonText: "CHOOSE GROWTH",
                badgeText: "MOST POPULAR",
                borderColor: "#e8a415",
                textColor: "text-[#e8a415]",
                priceColor: "text-[#d99504]",
                order: 2
            },
            {
                title: "PREMIUM BRANDING PACKAGE",
                subtitle: "Maximize Visibility and dominate your category",
                price: 45000,
                gstText: "+18% GST",
                features: [
                    "Everything in Growth Package",
                    "Homepage Banner Promotion (7 Days)",
                    "Dedicated Email Campaign",
                    "5 Social Media Promotions (5 Posts)",
                    "WhatsApp Marketing Push",
                    "Priority Listing & Branding Support"
                ],
                backgroundImage: "/images/11.png",
                buttonText: "CHOOSE PREMIUM",
                textColor: "text-gray-300",
                priceColor: "text-gray-300",
                order: 3
            }
        ];

        // Clear existing packages
        await EPromotionPackage.deleteMany({});
        console.log('🗑️ Existing packages cleared');

        // Insert new packages
        await EPromotionPackage.insertMany(initialPackages);
        console.log('✨ E-Promotion Packages seeded successfully!');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
};

seedEPromotionPackages();
