require('dotenv').config();
const mongoose = require('mongoose');
const LogisticPartner = require('../models/exhibitor_seller/LogisticPartner');

const defaultData = {
    hero: {
        logoTitle: 'International\nHealth & Wellness\nExpo 2026',
        logoBadge: 'Global Edition',
        logoRightText: 'Collaborate.\nConnect.\nGrow Together.',
        title: "LOGISTICS PARTNER",
        subTitle: "Powering Smooth Connections. Delivering Success Together.\nBe the preferred logistics partner for a global platform that unites health, wellness and innovation.",
        bgImage: "/images/partnership/nisu.webp",
        whyPartnerTitle: "WHY PARTNER\nWITH IHWE 2026?",
        whyPartnerPoints: [
            { text: "Access 8,000+ exhibitors, buyers & decision makers", icon: "Users" },
            { text: "High visibility before, during & after the event", icon: "Megaphone" },
            { text: "Be part of a trusted global health & wellness platform", icon: "Globe" },
            { text: "Build strong partnerships & long-term relationships", icon: "Handshake" },
            { text: "Enhance brand credibility & market leadership", icon: "Award" }
        ]
    },
    stats: [
        { icon: "Users", value: "8,000+", label: "Delegates &\nExhibitors Expected", color: "#6B46C1" },
        { icon: "Globe", value: "Multiple", label: "Exhibitor\nSegments", color: "#434190" },
        { icon: "Calendar", value: "3", label: "Power-Packed\nDays", color: "#D53F8C" },
        { icon: "Briefcase", value: "Unlimited", label: "Business\nOpportunities", color: "#3182CE" },
        { icon: "TrendingUp", value: "High", label: "Brand Visibility\n& Exposure", color: "#553C9A" }
    ],
    benefits: {
        main: [
            { title: "BRAND VISIBILITY", text: "Prominent logo placement across IHWE 2026 platforms, signage, and collaterals.", icon: "Megaphone", color: "#0B2C66" },
            { title: "DIRECT BUSINESS ACCESS", text: "Receive contact details of all exhibitors for their logistics & shipping requirements.", icon: "UserCheck", color: "#4E9F3D" },
            { title: "ON-SITE PRESENCE", text: "Branding at key logistical touchpoints inside the exhibition venue.", icon: "MapPin", color: "#0B2C66" },
            { title: "OPERATIONAL SUPPORT", text: "Preferred partner for exhibitor logistics with advance communication & coordination.", icon: "Package", color: "#4E9F3D" },
            { title: "DIGITAL PROMOTION", text: "Logo promotion on our website with a direct link to your website.", icon: "Monitor", color: "#0B2C66" }
        ],
        additionalTitle: "ADDITIONAL\nADVANTAGES",
        additional: [
            { text: "Opportunity to be the exclusive logistics partner for exhibitors", icon: "Truck" },
            { text: "Build trust as the go-to logistics expert", icon: "Award" },
            { text: "Access to a network of industry leaders & businesses", icon: "Users" },
            { text: "Opportunity to offer exclusive deals to exhibitors", icon: "TrendingUp" },
            { text: "Year-round visibility through pre & post event promotions", icon: "Handshake" }
        ]
    },
    packages: [
        {
            name: "Associate Partner",
            price: "₹1,25,000 + GST",
            color: "#4E9F3D",
            icon: "Truck",
            features: [
                "Logo on website & digital platforms"
            ]
        },
        {
            name: "Preferred Partner",
            price: "₹2,25,000 + GST",
            color: "#0B2C66",
            icon: "Truck",
            features: [
                "All benefits of Associate Partner",
                "Dedicated email promotions",
                "Premium logo placement"
            ]
        },
        {
            name: "Premier Partner",
            price: "₹3,75,000 + GST",
            color: "#7C3AED",
            icon: "Truck",
            features: [
                "All benefits of Preferred Partner",
                "On-site branding (booth / signage)",
                "Speaking opportunity / brand showcase",
                "Featured listing in all marketing"
            ]
        }
    ],
    footer: {
        successTitle: "LET'S MOVE SUCCESS TOGETHER!",
        successSub: "Partner with IHWE 2026 and deliver excellence at every step.",
        email: "info@ihwe.in",
        phone: "+91 9654900525",
        website: "www.ihwe.in"
    }
};

async function seed() {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log('✅ Connected to DB');

    let exists = await LogisticPartner.findOne();
    if (!exists) {
        await LogisticPartner.create(defaultData);
        console.log(`✅ Created Logistic Partner data`);
    } else {
        await LogisticPartner.findOneAndUpdate({}, defaultData);
        console.log(`🔄 Updated Logistic Partner data`);
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
