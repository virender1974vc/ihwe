const mongoose = require('mongoose');
const HotelStayPartner = require('./models/HotelStayPartner');
require('dotenv').config();

const seedHotelStayPartner = async () => {
    try {
        const uri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://localhost:27017/ihwe";
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for Hotel Stay Partner seed');

        // Clear existing collection
        await HotelStayPartner.deleteMany({});
        console.log('Cleared existing Hotel Stay Partner collection.');

        const defaultData = {
            hero: {
                title: "Health & Wellness\nExpo 2026\nGlobal Edition",
                subtitle: "Collaborate.\nConnect.\nGrow Together.",
                slogan: "Official Hotel Partner",
                badgeText: "Official\nHotel\nPartner",
                partnerTitle: "Partner with us as a",
                hotelPartnerLabel: "HOTEL & STAY PARTNER",
                hotelPartnerDesc: "Be the preferred stay for a global community of\nhealth & wellness leaders, innovators & changemakers.",
                whyPartnerTitle: "Why Partner\nWith IHWE 2026?",
                image: "/assets/hotel/compressed_hotel.jpg.webp",
                whyPartnerItems: [
                    { text: "Direct access to a premium, pre-qualified audience", icon: "Users" },
                    { text: "High visibility before, during & after the event", icon: "TrendingUp" },
                    { text: "Be part of a trusted global health & wellness movement", icon: "Shield" },
                    { text: "Build long-term business relationships", icon: "Handshake" },
                    { text: "Enhance brand credibility and market leadership", icon: "Award" }
                ]
            },
            stats: [
                { value: "8,000+", label: "Delegates &\nExhibitors Expected", icon: "Users" },
                { value: "50+", label: "Countries\nParticipating", icon: "Globe" },
                { value: "3", label: "Power-Packed\nDays", icon: "Calendar" },
                { value: "Unlimited", label: "Business\nOpportunities", icon: "Briefcase" },
                { value: "High", label: "Brand Visibility\n& Exposure", icon: "Megaphone" }
            ],
            benefits: {
                companyCard: {
                    title: "What's in it for your company?",
                    items: [
                        { text: "Direct access to 8,000+ high-value delegates, speakers & exhibitors", icon: "Star" },
                        { text: "Increased room bookings during the event period", icon: "Users2" },
                        { text: "Brand visibility across IHWE 2026 platforms (website, app, emails, social media)", icon: "Megaphone" },
                        { text: "Promotion of exclusive stay offers to a global audience", icon: "Tag" },
                        { text: "Networking with global brands, associations & decision makers", icon: "Handshake" },
                        { text: "Association with a prestigious international health & wellness event", icon: "Star" }
                    ]
                },
                ihweCard: {
                    title: "What's in it for IHWE 2026?",
                    items: [
                        { text: "Preferred stay options for delegates, speakers & exhibitors", icon: "Users" },
                        { text: "Competitive room tariffs & seamless hospitality experience", icon: "Hotel" },
                        { text: "Reliable accommodation support ensuring smooth event participation", icon: "ShieldCheck" },
                        { text: "Value-added services enhancing delegate satisfaction", icon: "Zap" },
                        { text: "Strengthening global connectivity & participation in the event", icon: "Globe" }
                    ]
                },
                perksCard: {
                    title: "Partner Perks",
                    items: [
                        { label: "Logo Visibility on all IHWE 2026 platforms", icon: "Globe" },
                        { label: "Co-branded Stay Offers", icon: "Ticket" },
                        { label: "Priority Check-in for Delegates", icon: "UserCheck" },
                        { label: "Welcome Kit Inclusion", icon: "Gift" },
                        { label: "Special Delegate Discounts", icon: "Percent" },
                        { label: "Hospitality Branding Opportunities", icon: "Bed" }
                    ]
                }
            },
            packages: {
                title: "PARTNERSHIP PACKAGES & INVESTMENT",
                items: [
                    { name: "ASSOCIATE PARTNER", price: "₹1,00,000 + GST", icon: "Globe", color: "#0B3931", titleColor: "#ffffff" },
                    { name: "PREFERRED PARTNER", price: "₹2,00,000 + GST", icon: "Star", color: "#050A1A", titleColor: "#ffffff" },
                    { name: "PREMIER PARTNER", price: "₹3,50,000 + GST", icon: "Crown", color: "#1A365D", titleColor: "#ffffff" }
                ],
                notes: [
                    { text: "Custom packages available on request", id: "note-1" },
                    { text: "GST as applicable", id: "note-2" },
                    { text: "Stay vouchers valid during event period", id: "note-3" }
                ]
            },
            footer: {
                image: "/assets/hotel/hotelfoterimage.png",
                footerTitle: "Together, let's create",
                footerSubtitle: "Memorable Experiences",
                footerItalicText: "for a Healthier Tomorrow",
                footerGrowTitle: "Let's Grow Together!",
                email: "info@ihwe.in",
                phone: "+91 9654900525",
                perks: [
                    { label: "Global Audience Access", icon: "Globe" },
                    { label: "Brand Exposure", icon: "Megaphone" },
                    { label: "Business Growth", icon: "TrendingUp" },
                    { label: "Long-term Partnership", icon: "Handshake" },
                    { label: "Positive Global Impact", icon: "Heart" }
                ]
            }
        };

        const doc = new HotelStayPartner(defaultData);
        await doc.save();

        console.log('Hotel Stay Partner seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Hotel Stay Partner seed error:', err.message);
        process.exit(1);
    }
};

seedHotelStayPartner();
