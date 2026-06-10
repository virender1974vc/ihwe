const mongoose = require('mongoose');
const FabricationPartner = require('./models/FabricationPartner');
require('dotenv').config();

const seedFabricationPartner = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Fabrication Partner seed');

        await FabricationPartner.deleteMany({});
        console.log('Cleared existing Fabrication Partner collection.');

        const defaultData = {
            hero: {
                title: "International\nHealth & Wellness\nExpo 2026",
                subtitle: "Collaborate.\nConnect.\nGrow Together.",
                slogan: "Global Edition",
                badgeText: "Official\nFabrication\nPartner",
                partnerTitle: "Partner with us as a",
                fabricationPartnerLabel: "STALL DESIGNER & FABRICATION PARTNER",
                fabricationPartnerDesc: "Be the preferred fabrication partner for a global community of health & wellness leaders, innovators & changemakers.",
                whyPartnerTitle: "Why Partner\nWith IHWE 2026?",
                image: "/assets/fabrication.png",
                whyPartnerItems: [
                    { text: "Access a premium, pre-qualified global audience", icon: "Users" },
                    { text: "High visibility before, during & after the event", icon: "Megaphone" },
                    { text: "Be part of a trusted global health & wellness movement", icon: "Globe" },
                    { text: "Build long-term business relationships", icon: "Handshake" },
                    { text: "Enhance brand credibility and leadership", icon: "Award" }
                ]
            },
            stats: [
                { value: "8,000+", label: "Visitor / Delegates", icon: "Users", color: "#04777a" },
                { value: "1000+", label: "Global Buyers", icon: "Globe", color: "#707717" },
                { value: "3", label: "Power-Packed\nDays", icon: "Calendar", color: "#b37504" },
                { value: "Unlimited", label: "Business\nOpportunities", icon: "Briefcase", color: "#01366a" },
                { value: "High", label: "Brand Visibility\n& Exposure", icon: "TrendingUp", color: "#036975" }
            ],
            benefits: {
                companyCard: {
                    title: "What's in it for your company?",
                    items: [
                        { text: "Direct access to exhibitors seeking custom stall designs & fabrication", icon: "Users" },
                        { text: "Exclusive branding space in the exhibition venue during set-up", icon: "TrendingUp" },
                        { text: "Featured profile on the official IHWE website and partner directory", icon: "Award" },
                        { text: "Temporary electricity connection during fabrication days", icon: "Zap" },
                        { text: "Promotion in pre-event emailers sent to registered exhibitors", icon: "Mail" }
                    ]
                },
                ihweCard: {
                    title: "What's in it for IHWE 2026?",
                    items: [
                        { text: "Premium design aesthetics aligning with global IHWE standards", icon: "Palette" },
                        { text: "Strict adherence to safety and structural stability guidelines", icon: "ShieldAlert" },
                        { text: "Timely stall completion and setup within designated move-in hours", icon: "Clock" },
                        { text: "Dedicated on-site fabrication coordinators for assistance", icon: "UserCheck" },
                        { text: "Post-event dismantling and eco-friendly waste management assistance", icon: "Leaf" }
                    ]
                },
                perksCard: {
                    title: "Partner Perks",
                    items: [
                        { label: "Logo Visibility on all IHWE 2026 platforms", icon: "Globe" },
                        { label: "Exhibitor Directory Listing", icon: "FileText" },
                        { label: "On-site Branding at Strategic Locations", icon: "Image" },
                        { label: "Priority Connection Support", icon: "Zap" },
                        { label: "Co-branded Partner Badge", icon: "Award" },
                        { label: "Access to Exhibitor Enquiries", icon: "Mail" }
                    ]
                }
            },
            packages: {
                title: "PARTNERSHIP PACKAGES & INVESTMENT",
                items: [
                    { name: "ASSOCIATE PARTNER", price: "₹1,25,000 + GST", icon: "Globe", color: "#00767a", titleColor: "#ffffff" },
                    { name: "PREFERRED PARTNER", price: "₹2,25,000 + GST", icon: "Star", color: "#7e8617", titleColor: "#ffffff" },
                    { name: "PREMIER PARTNER", price: "₹3,75,000 + GST", icon: "Crown", color: "#ba7b07", titleColor: "#ffffff" }
                ],
                notes: [
                    { text: "Custom packages available on request", id: "note-1" },
                    { text: "GST as applicable", id: "note-2" },
                    { text: "Featured exhibitor listing directory included", id: "note-3" }
                ]
            },
            footer: {
                image: "/images/stall.png",
                footerTitle: "LET’S DESIGN.",
                footerSubtitle: "LET’S BUILD.",
                footerItalicText: "LET’S GROW TOGETHER!",
                footerGrowTitle: "Stall Designing & Fabrication",
                email: "info@ihwe.in",
                phone: "+91 9654900525",
                perks: [
                    { label: "Global Audience Access", icon: "Globe" },
                    { label: "Brand Exposure", icon: "Megaphone" },
                    { label: "Business Growth", icon: "TrendingUp" },
                    { label: "Long-term Partnership", icon: "Handshake" },
                    { label: "Creative Impact", icon: "Palette" }
                ]
            }
        };

        const doc = new FabricationPartner(defaultData);
        await doc.save();

        console.log('Fabrication Partner seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Fabrication Partner seed error:', err.message);
        process.exit(1);
    }
};

seedFabricationPartner();
