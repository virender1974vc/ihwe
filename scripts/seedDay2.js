const mongoose = require("mongoose");
const ConferenceDay = require("../models/ConferenceDay");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/arogyasangosti";

const day2Data = {
  dayNumber: 2,
  hero: {
    title: "GLOBAL WELLNESS",
    subtitle: "LEADERSHIP FORUM",
    date: "22 August 2026",
    category: "Day 2",
    description: "Redefining the wellness economy through leadership, technology and holistic health.",
    backgroundImage: "",
    stats: [
      { label: "SESSIONS", value: "6 IMPACTFUL" },
      { label: "EXPERTS", value: "GLOBAL" },
      { label: "NETWORKING", value: "STRATEGIC" }
    ]
  },
  about: {
    title: "ABOUT DAY 2",
    description: "The Global Wellness Leadership Forum explores the intersection of wellness, economy, and technology.",
    descriptionSecondary: "Leaders from around the world gather to discuss the future of the wellness industry.",
    focusAreas: [
      "Wellness Economy & Market Trends",
      "Ayurveda, AYUSH & Holistic Healing",
      "Fitness, Preventive Health & Lifestyle Medicine",
      "Beauty, Personal Care & Wellness Innovation",
      "Organic Living, Nutrition & Sustainable Wellness",
      "Wellness Leaders Networking"
    ]
  },
  agenda: {
    title: "DAY 2 AGENDA — 21 AUGUST 2026",
    subtitle: "6 Insightful Sessions | 1 Powerful Day",
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        session: "SESSION 1",
        type: "KEYNOTE",
        topic: "Wellness Economy & Global Opportunities",
        description: "The future of wellness industry and global market trends.",
        speaker: { name: "Dr. James Porter", role: "Global Wellness Economist", company: "International Wellness Institute", flag: "🇺🇸" }
      },
      {
        time: "11:00 AM - 11:45 AM",
        session: "SESSION 2",
        type: "PANEL",
        topic: "Ayurveda, AYUSH & Holistic Healing",
        description: "Ancient wisdom for modern health and natural healing approaches.",
        speaker: { name: "Dr. Ananya Sharma", role: "Director – AYUSH Initiatives", company: "Ministry of AYUSH", flag: "🇮🇳" }
      },
      {
        time: "12:00 PM - 12:45 PM",
        session: "SESSION 3",
        type: "EXPERT TALK",
        topic: "Fitness, Preventive Health & Lifestyle Medicine",
        description: "Preventive care and lifestyle changes for long-term wellness.",
        speaker: { name: "Dr. Michael Lee", role: "Lifestyle Medicine Specialist", company: "Harvard Medical School", flag: "🇺🇸" }
      },
      {
        time: "02:00 PM - 02:45 PM",
        session: "SESSION 4",
        type: "PANEL",
        topic: "Beauty, Personal Care & Wellness Innovation",
        description: "Clean beauty, wellness innovation and future trends.",
        speaker: { name: "Ms. Sophia Laurent", role: "CEO, Global Beauty & Wellness", company: "Loreal Wellness", flag: "🇫🇷" }
      },
      {
        time: "03:00 PM - 03:45 PM",
        session: "SESSION 5",
        type: "EXPERT TALK",
        topic: "Organic Living, Nutrition & Sustainable Wellness",
        description: "Nutrition, natural living and sustainable wellness practices.",
        speaker: { name: "Dr. Rajesh Nair", role: "Nutritionist & Wellness Expert", company: "WHO Advisor", flag: "🇮🇳" }
      },
      {
        time: "04:00 PM - 05:00 PM",
        session: "SESSION 6",
        type: "NETWORKING",
        topic: "Wellness Leaders Networking Session",
        description: "Connect with global wellness leaders, experts, and industry innovators.",
        speaker: { name: "Wellness Leaders", role: "Global Experts", company: "Industry Innovators", flag: "🌐" }
      }
    ]
  },
  featuredSpeakers: [
    { name: "Dr. James Porter", role: "Global Wellness Economist", company: "International Wellness Institute", image: "", category: "KEYNOTE SPEAKER" },
    { name: "Dr. Ananya Sharma", role: "Director – AYUSH Initiatives", company: "Ministry of AYUSH", image: "", category: "PANELIST" },
    { name: "Dr. Michael Lee", role: "Lifestyle Medicine Specialist", company: "Harvard Medical School", image: "", category: "SPEAKER" },
    { name: "Ms. Sophia Laurent", role: "CEO, Global Beauty", company: "Loreal Wellness", image: "", category: "PANELIST" },
    { name: "Dr. Rajesh Nair", role: "Nutritionist & Expert", company: "WHO Advisor", image: "", category: "SPEAKER" },
    { name: "Dr. Emma Wilson", role: "Founder", company: "Natural Living Wellness", image: "", category: "PANELIST" }
  ],
  cta: {
    bePartTitle: "Be Part Of Day 2",
    bePartDescription: "Connect with the future of digital wellness.",
    delegatePass: { title: "Digital Pass", description: "Access all tech sessions and the innovation lounge." },
    sponsor: { title: "Tech Sponsorship", description: "Position your brand at the forefront of health innovation." }
  },
  isActive: true
};

const seedDay2 = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Day 2 seeding...");

    await ConferenceDay.findOneAndUpdate(
      { dayNumber: 2 },
      { $set: day2Data },
      { upsert: true, new: true }
    );

    console.log("Seeded Day 2 successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Day 2:", error);
    process.exit(1);
  }
};

seedDay2();
