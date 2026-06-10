const mongoose = require('mongoose');

const hotelStayPartnerSchema = new mongoose.Schema({
    hero: {
        title: { type: String, default: "Health & Wellness\nExpo 2026\nGlobal Edition" },
        subtitle: { type: String, default: "Global Edition" },
        slogan: { type: String, default: "Collaborate.\nConnect.\nGrow Together." },
        badgeText: { type: String, default: "Official\nHotel\nPartner" },
        partnerTitle: { type: String, default: "Partner with us as a" },
        hotelPartnerLabel: { type: String, default: "HOTEL & STAY PARTNER" },
        hotelPartnerDesc: { type: String, default: "Be the preferred stay for a global community of\nhealth & wellness leaders, innovators & changemakers." },
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
            icon: { type: String }
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
        footerTitle: { type: String, default: "Together, let's create" },
        footerSubtitle: { type: String, default: "Memorable Experiences" },
        footerItalicText: { type: String, default: "for a Healthier Tomorrow" },
        footerGrowTitle: { type: String, default: "Let's Grow Together!" },
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

module.exports = mongoose.model('HotelStayPartner', hotelStayPartnerSchema);
