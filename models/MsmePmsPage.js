const mongoose = require('mongoose');

const msmePmsPageSchema = new mongoose.Schema({
    // Hero Section
    heroSubTitle: { type: String, default: "GOVERNMENT SUPPORT TO GROW YOUR BUSINESS" },
    heroTitle: { type: String, default: "MSME PMS SCHEME" },
    heroSubTitle2: { type: String, default: "BENEFITS & REGISTRATION" },
    heroDescription: { type: String, default: "Exhibit at International Health & Wellness Expo 2026 with Financial Assistance from Ministry of MSME, Government of India." },
    heroBannerImg: { type: String, default: "/msmepmsscheme/msme_pms_header_banner.png" },

    // Subsidy Section
    subsidyLimit: { type: String, default: "₹1,50,000" },
    subsidyImg: { type: String, default: "/msmepmsscheme/mony-bag.png" },
    subsidyFeatures: [{ type: String, default: ["Government Financial Support", "Increase Market Reach", "Grow Your Business Globally"] }],
    subsidyFooterTexts: [{ type: String, default: ["TYPICALLY ₹50,000 – ₹1,00,000", "HIGHER SUPPORT FOR ELIGIBLE CASES"] }],
    subsidyNotice: { type: String, default: "*Subsidy amount may vary as per MSME guidelines, category and approval." },

    // Stats Section
    stats: [{
        img: String,
        val: String,
        label: String
    }],

    // Footer Stats Section
    footerStats: [{
        img: String,
        val: String,
        label: String
    }],

    // About Section
    aboutTitle: { type: String, default: "ABOUT PMS SCHEME" },
    aboutImg: { type: String, default: "/msmepmsscheme/aboutpmsscheme.png" },
    aboutParagraphs: [{ type: String, default: [
        "The Procurement and Marketing Support (PMS) Scheme of the Ministry of MSME, Government of India, aims to provide financial assistance to Micro, Small and Medium Enterprises (MSMEs) for participating in domestic and international exhibitions / trade fairs.",
        "The scheme helps MSMEs promote their products, explore new markets, enhance brand visibility and generate business opportunities."
    ]}],

    // Benefits Section
    benefitsTitle: { type: String, default: "BENEFITS OF PMS SCHEME" },
    benefits: [{
        img: String,
        title: String,
        desc: String
    }],

    // Guidelines Collage Image
    collageImg: { type: String, default: "/msmepmsscheme/msme_exhibition_stalls_grid.png" },

    // Three Column Info Grid
    whoCanApplyTitle: { type: String, default: "WHO CAN APPLY?" },
    whoCanApplyItems: [{ type: String, default: [
        "MSMEs with valid Udyam Registration",
        "Manufacturers / Service Providers",
        "Startups registered under MSME category",
        "Businesses in Health, Wellness, Ayurveda, Organic, Pharma, Nutraceuticals and related sectors"
    ]}],

    whyPmsTitle: { type: String, default: "WHY PMS SCHEME?" },
    whyPmsImg: { type: String, default: "/msmepmsscheme/whypms.png" },
    whyPmsItems: [{ type: String, default: [
        "Encourages MSMEs to participate in exhibitions",
        "Helps in exploring new markets & technologies",
        "Strengthens competitiveness and innovation",
        "Supports sustainable growth and development"
    ]}],

    eligibilityTitle: { type: String, default: "ELIGIBILITY CRITERIA" },
    eligibilityItems: [{ type: String, default: [
        "Applicant should be a registered MSME with valid Udyam Certificate",
        "The enterprise should be in manufacturing or service sector",
        "Should not have availed PMS benefit for the same exhibition in the previous financial year",
        "Subject to approval by Ministry of MSME"
    ]}],

    // Form Section
    formTitle: { type: String, default: "APPLY FOR PMS SCHEME – IHWE 2026" },
    formSubTitle: { type: String, default: "Claim your subsidy and grow your business at IHWE 2026!" },

    // Bottom CTA Section
    bottomCtaTitle: { type: String, default: "Don't Miss This Government-Supported Opportunity!" },
    bottomCtaHighlight: { type: String, default: "Government-Supported Opportunity!" },
    bottomCtaDesc: { type: String, default: "Exhibit at IHWE 2026 and take your business to the next level with financial support under the MSME PMS Scheme." },

    // Help Box Section
    helpTitle: { type: String, default: "Need Help?" },
    helpSubTitle: { type: String, default: "Our team is here to assist you" },
    helpPhone: { type: String, default: "+91 9654900525" },
    helpEmail: { type: String, default: "info@ihwe.in" },

    // Footer CTA Image & Social Links
    footerCtaImg: { type: String, default: "/msmepmsscheme/Announcement.png" },
    facebookUrl: { type: String, default: "https://www.facebook.com/namogangewellness.event" },
    instagramUrl: { type: String, default: "https://instagram.com" },
    twitterUrl: { type: String, default: "https://twitter.com" },
    linkedinUrl: { type: String, default: "https://linkedin.com" },
    youtubeUrl: { type: String, default: "https://youtube.com" }
}, { timestamps: true });

module.exports = mongoose.model('MsmePmsPage', msmePmsPageSchema);
