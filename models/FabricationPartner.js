const mongoose = require('mongoose');

const fabricationPartnerSchema = new mongoose.Schema({
    hero: {
        title: { type: String, default: "International\nHealth & Wellness\nExpo 2026" },
        subtitle: { type: String, default: "Collaborate.\nConnect.\nGrow Together." },
        slogan: { type: String, default: "Global Edition" },
        badgeText: { type: String, default: "Official\nFabrication\nPartner" },
        partnerTitle: { type: String, default: "Partner with us as a" },
        fabricationPartnerLabel: { type: String, default: "STALL DESIGNER & FABRICATION PARTNER" },
        fabricationPartnerDesc: { type: String, default: "Be the preferred fabrication partner for a global community of health & wellness leaders, innovators & changemakers." },
        whyPartnerTitle: { type: String, default: "Why Partner\nWith IHWE 2026?" },
        image: { type: String, default: "" }, // Background image path
        whyPartnerItems: [
            {
                text: { type: String },
                icon: { type: String }
            }
        ]
    },
    stats: [
        {
            value: { type: String },
            label: { type: String },
            icon: { type: String },
            color: { type: String }
        }
    ],
    benefits: {
        companyCard: {
            title: { type: String, default: "What's in it for your company?" },
            items: [
                {
                    text: { type: String },
                    icon: { type: String }
                }
            ]
        },
        ihweCard: {
            title: { type: String, default: "What's in it for IHWE 2026?" },
            items: [
                {
                    text: { type: String },
                    icon: { type: String }
                }
            ]
        },
        perksCard: {
            title: { type: String, default: "Partner Perks" },
            items: [
                {
                    label: { type: String },
                    icon: { type: String }
                }
            ]
        }
    },
    packages: {
        title: { type: String, default: "PARTNERSHIP PACKAGES & INVESTMENT" },
        items: [
            {
                name: { type: String },
                price: { type: String },
                icon: { type: String },
                color: { type: String },
                titleColor: { type: String }
            }
        ],
        notes: [
            {
                text: { type: String },
                id: { type: String }
            }
        ]
    },
    footer: {
        image: { type: String, default: "" }, // Footer badge image path
        footerTitle: { type: String, default: "LET’S DESIGN." },
        footerSubtitle: { type: String, default: "LET’S BUILD." },
        footerItalicText: { type: String, default: "LET’S GROW TOGETHER!" },
        footerGrowTitle: { type: String, default: "Stall Designing & Fabrication" },
        email: { type: String, default: "info@ihwe.in" },
        phone: { type: String, default: "+91 9654900525" },
        perks: [
            {
                label: { type: String },
                icon: { type: String }
            }
        ]
    }
}, { timestamps: true });

module.exports = mongoose.model('FabricationPartner', fabricationPartnerSchema);
