const mongoose = require('mongoose');
const TravelPartner = require('./models/TravelPartner');
require('dotenv').config();

const seedTravelPartner = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Travel Partner seed');

        await TravelPartner.deleteMany({});
        console.log('Cleared existing Travel Partner collection.');

        const defaultData = {
            hero: {
                title: "International\nHealth & Wellness\nExpo 2026",
                subtitle: "Collaborate.\nConnect.\nGrow Together.",
                slogan: "Global Edition",
                badgeText: "Official\nTravel\nPartner",
                partnerTitle: "Partner with us as a",
                travelPartnerLabel: "TRAVEL PARTNER",
                travelPartnerDesc: "Be the preferred travel partner for a global community\nof health & wellness leaders, innovators & changemakers.",
                whyPartnerTitle: "Why Partner\nWith IHWE 2026?",
                image: "/assets/travels/newherologo.webp",
                whyPartnerItems: [
                    { text: "Access a premium, pre-qualified global audience", icon: "Users" },
                    { text: "High visibility before, during & after the event", icon: "Megaphone" },
                    { text: "Be part of a trusted global health & wellness movement", icon: "Globe" },
                    { text: "Build long-term business relationships", icon: "Handshake" },
                    { text: "Enhance brand credibility and leadership", icon: "Award" }
                ]
            },
            stats: [
                { value: "8,000+", label: "Delegates &\nExhibitors", icon: "Users" },
                { value: "50+", label: "Countries\nParticipating", icon: "Globe" },
                { value: "3", label: "Power-Packed\nDays", icon: "Calendar" },
                { value: "Unlimited", label: "Business\nOpportunities", icon: "Briefcase" },
                { value: "High", label: "Brand Visibility\n& Exposure", icon: "TrendingUp" }
            ],
            benefits: {
                companyCard: {
                    title: "What's in it for your company?",
                    items: [
                        { text: "Direct access to 8,000+ high-value delegates, speakers & exhibitors", icon: "Star" },
                        { text: "Increased flight bookings during the event period", icon: "Users2" },
                        { text: "Brand visibility across IHWE 2026 platforms (website, app, emails, social media)", icon: "Megaphone" },
                        { text: "Promotion of exclusive travel offers to a global audience", icon: "Tag" },
                        { text: "Networking with global brands, associations & decision makers", icon: "Handshake" },
                        { text: "Association with a prestigious international health & wellness event", icon: "Star" }
                    ]
                },
                ihweCard: {
                    title: "What's in it for IHWE 2026?",
                    items: [
                        { text: "Preferred travel options for delegates, speakers & exhibitors", icon: "Users" },
                        { text: "Competitive flight fares & seamless travel experience", icon: "Plane" },
                        { text: "Reliable travel support ensuring smooth event participation", icon: "ShieldCheck" },
                        { text: "Value-added services enhancing delegate satisfaction", icon: "Zap" },
                        { text: "Strengthening global connectivity & participation in the event", icon: "Globe" }
                    ]
                },
                perksCard: {
                    title: "Partner Perks",
                    items: [
                        { label: "Logo Visibility on all IHWE 2026 platforms", icon: "Globe" },
                        { label: "Co-branded Flight Offers", icon: "Ticket" },
                        { label: "Priority Access for Delegates", icon: "UserCheck" },
                        { label: "Welcome Kit Inclusion", icon: "Gift" },
                        { label: "Special Delegate Discounts", icon: "Percent" },
                        { label: "Lounge Branding Opportunities", icon: "Armchair" }
                    ]
                }
            },
            packages: {
                title: "PARTNERSHIP PACKAGES & INVESTMENT",
                items: [
                    { name: "Associate Partner", price: "₹1,00,000 + GST", icon: "Send", color: "#4E9F3D", titleColor: "#4E9F3D" },
                    { name: "Preferred Partner", price: "₹2,00,000 + GST", icon: "Plane", color: "#0B2C66", titleColor: "#0B2C66" },
                    { name: "Premier Partner", price: "₹3,50,000 + GST", icon: "Crown", color: "#7C3AED", titleColor: "#7C3AED" }
                ],
                notes: [
                    { text: "Custom packages available on request", id: "note-1" },
                    { text: "GST as applicable", id: "note-2" },
                    { text: "Stay vouchers valid during event period", id: "note-3" }
                ]
            },
            footer: {
                image: "/assets/nishu.png",
                footerTitle: "Together, let's",
                footerSubtitle: "Connect the world to",
                footerItalicText: "Health & Wellness!",
                footerGrowTitle: "Let's Grow Together!",
                email: "info@ihwe.in",
                phone: "+91 9654900525",
                perks: [
                    { label: "Global Audience Access", icon: "Users" },
                    { label: "High Brand Exposure", icon: "Megaphone" },
                    { label: "Business Growth", icon: "TrendingUp" },
                    { label: "Long-term Partnership", icon: "Handshake" },
                    { label: "Positive Global Impact", icon: "Globe" }
                ]
            }
        };

        const doc = new TravelPartner(defaultData);
        await doc.save();

        console.log('Travel Partner seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Travel Partner seed error:', err.message);
        process.exit(1);
    }
};

seedTravelPartner();
