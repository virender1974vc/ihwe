require('dotenv').config();
const mongoose = require('mongoose');
const MsmePmsPage = require('./models/MsmePmsPage');

const seedMsmePmsPage = async () => {
  try {
    const mongoUri = process.env.MONGO_URI_MAIN || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ihwe";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding MSME PMS Page configuration');

    // Clear existing MsmePmsPage configuration
    await MsmePmsPage.deleteMany({});
    console.log('Cleared existing MSME PMS Page configuration');

    // Insert Default Page configuration
    const defaultData = {
      heroSubTitle: "GOVERNMENT SUPPORT TO GROW YOUR BUSINESS",
      heroTitle: "MSME PMS SCHEME",
      heroSubTitle2: "BENEFITS & REGISTRATION",
      heroDescription: "Exhibit at International Health & Wellness Expo 2026 with Financial Assistance from Ministry of MSME, Government of India.",
      heroBannerImg: "/msmepmsscheme/msme_pms_header_banner.png",
      subsidyLimit: "₹1,50,000",
      subsidyImg: "/msmepmsscheme/mony-bag.png",
      subsidyFeatures: [
        "Government Financial Support",
        "Increase Market Reach",
        "Grow Your Business Globally"
      ],
      subsidyFooterTexts: [
        "TYPICALLY ₹50,000 – ₹1,00,000",
        "HIGHER SUPPORT FOR ELIGIBLE CASES"
      ],
      subsidyNotice: "*Subsidy amount may vary as per MSME guidelines, category and approval.",
      stats: [
        { img: "/msmepmsscheme/global.png", val: "1,000+", label: "GLOBAL BUYERS" },
        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
        { img: "/msmepmsscheme/businessOpportunities.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
        { img: "/msmepmsscheme/networkevents.png", val: "MULTIPLE", label: "NETWORKING EVENTS" },
      ],
      footerStats: [
        { img: "/msmepmsscheme/global1.png", val: "1,000+", label: "GLOBAL BUYERS" },
        { img: "/msmepmsscheme/exhibitors.png", val: "150+", label: "EXHIBITORS" },
        { img: "/msmepmsscheme/visitors.png", val: "8,000+", label: "VISITORS/ DELEGATES" },
        { img: "/msmepmsscheme/conference.png", val: "18+", label: "CONFERENCE SESSIONS" },
        { img: "/msmepmsscheme/businessOpportunities1.png", val: "3 DAYS", label: "OF BUSINESS OPPORTUNITIES" },
      ],
      aboutTitle: "ABOUT PMS SCHEME",
      aboutImg: "/msmepmsscheme/aboutpmsscheme.png",
      aboutParagraphs: [
        "The Procurement and Marketing Support (PMS) Scheme of the Ministry of MSME, Government of India, aims to provide financial assistance to Micro, Small and Medium Enterprises (MSMEs) for participating in domestic and international exhibitions / trade fairs.",
        "The scheme helps MSMEs promote their products, explore new markets, enhance brand visibility and generate business opportunities."
      ],
      benefitsTitle: "BENEFITS OF PMS SCHEME",
      benefits: [
        { img: "/msmepmsscheme/reimbursement.png", title: "Up to ₹1.5 Lakh* Reimbursement", desc: "Subsidy on stall booking & participation cost" },
        { img: "/msmepmsscheme/reducedCost.png", title: "Reduced Cost", desc: "Lower financial burden for market expansion" },
        { img: "/msmepmsscheme/marketexposure.png", title: "Market Exposure", desc: "Showcase your products to national & international buyers" },
        { img: "/msmepmsscheme/businessgrowth.png", title: "Business Growth", desc: "Generate leads & expand your network" },
        { img: "/msmepmsscheme/govsupport.png", title: "Government Support", desc: "Exhibit with the backing of Ministry of MSME" },
        { img: "/msmepmsscheme/brandvisibility.png", title: "Brand Visibility", desc: "Enhance brand credibility and recognition" },
      ],
      collageImg: "/msmepmsscheme/msme_exhibition_stalls_grid.png",
      whoCanApplyTitle: "WHO CAN APPLY?",
      whoCanApplyItems: [
        "MSMEs with valid Udyam Registration",
        "Manufacturers / Service Providers",
        "Startups registered under MSME category",
        "Businesses in Health, Wellness, Ayurveda, Organic, Pharma, Nutraceuticals and related sectors"
      ],
      whyPmsTitle: "WHY PMS SCHEME?",
      whyPmsImg: "/msmepmsscheme/whypms.png",
      whyPmsItems: [
        "Encourages MSMEs to participate in exhibitions",
        "Helps in exploring new markets & technologies",
        "Strengthens competitiveness and innovation",
        "Supports sustainable growth and development"
      ],
      eligibilityTitle: "ELIGIBILITY CRITERIA",
      eligibilityItems: [
        "Applicant should be a registered MSME with valid Udyam Certificate",
        "The enterprise should be in manufacturing or service sector",
        "Should not have availed PMS benefit for the same exhibition in the previous financial year",
        "Subject to approval by Ministry of MSME"
      ],
      formTitle: "APPLY FOR PMS SCHEME – IHWE 2026",
      formSubTitle: "Claim your subsidy and grow your business at IHWE 2026!",
      bottomCtaTitle: "Don't Miss This Government-Supported Opportunity!",
      bottomCtaHighlight: "Government-Supported Opportunity!",
      bottomCtaDesc: "Exhibit at IHWE 2026 and take your business to the next level with financial support under the MSME PMS Scheme.",
      helpTitle: "Need Help?",
      helpSubTitle: "Our team is here to assist you",
      helpPhone: "+91 9654900525",
      helpEmail: "info@ihwe.in",
      footerCtaImg: "/msmepmsscheme/Announcement.png",
      facebookUrl: "https://www.facebook.com/namogangewellness.event",
      instagramUrl: "https://instagram.com",
      twitterUrl: "https://twitter.com",
      linkedinUrl: "https://linkedin.com",
      youtubeUrl: "https://youtube.com"
    };

    const seededPage = await MsmePmsPage.create(defaultData);
    console.log('MSME PMS Page configuration seeded successfully:', seededPage._id);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding MSME PMS Page configuration:', error);
    process.exit(1);
  }
};

seedMsmePmsPage();
