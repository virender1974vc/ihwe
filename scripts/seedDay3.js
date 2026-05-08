const mongoose = require("mongoose");
const ConferenceDay = require("../models/ConferenceDay");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/arogyasangosti";

const day3Data = {
  dayNumber: 3,
  hero: {
    title: "FUTURE OF <span class=\"text-[#4E9F3D]\">PREVENTIVE</span><br />HEALTHCARE<br />CONFERENCE",
    subtitle: "",
    date: "23 August 2026",
    category: "Day 3",
    description: "Strengthening prevention, public health & sustainability for a healthier planet.",
    backgroundImage: "",
    stats: [
      { label: "SESSIONS", value: "6 IMPACTFUL" },
      { label: "EXPERTS", value: "GLOBAL" },
      { label: "NETWORKING", value: "STRATEGIC" }
    ]
  },
  about: {
    title: "ABOUT DAY 3",
    description: "The Future of Preventive Healthcare Conference focuses on building a proactive healthcare ecosystem through prevention, early detection, public health strategies, and sustainability.",
    descriptionSecondary: "This day brings together global thought leaders to create actionable solutions for a healthier, resilient & sustainable future.",
    focusAreas: [
      "Preventive Medicine & Early Detection",
      "Public Health & Community Wellness",
      "Sustainability & Planetary Health",
      "Nutrition, Lifestyle & Mental Well-being",
      "Research, Innovation & Evidence-based Care",
      "Policy, Advocacy & Global Partnerships"
    ]
  },
  agenda: {
    title: "DAY 3 AGENDA — 23 AUGUST 2026",
    subtitle: "6 Insightful Sessions | 1 Powerful Day",
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        session: "SESSION 1",
        type: "KEYNOTE",
        topic: "The Future of Preventive Healthcare",
        description: "Global strategies for prevention and population health.",
        speaker: { name: "Dr. Sanjay Gupta", role: "Chief Medical Correspondent", company: "CNN", flag: "🇺🇸" }
      },
      {
        time: "11:00 AM - 11:45 AM",
        session: "SESSION 2",
        type: "PANEL",
        topic: "Public Health & Community Wellness",
        description: "Building healthier communities through collaboration and awareness.",
        speaker: { name: "Dr. Soumya Swaminathan", role: "Former Chief Scientist", company: "WHO", flag: "🌐" }
      },
      {
        time: "12:00 PM - 12:45 PM",
        session: "SESSION 3",
        type: "EXPERT TALK",
        topic: "Nutrition, Lifestyle & Well-being",
        description: "Food, fitness & mindfulness for a healthy tomorrow.",
        speaker: { name: "Luke Coutinho", role: "Holistic Lifestyle Expert", company: "Speaker", flag: "🇮🇳" }
      },
      {
        time: "02:00 PM - 02:45 PM",
        session: "SESSION 4",
        type: "PANEL",
        topic: "Sustainability & Planetary Health",
        description: "Climate change, environment & health impact.",
        speaker: { name: "Dr. R. Balakrishnan", role: "Director", company: "PHFI", flag: "🇮🇳" }
      },
      {
        time: "03:00 PM - 03:45 PM",
        session: "SESSION 5",
        type: "EXPERT TALK",
        topic: "Research & Innovation in Prevention",
        description: "From data to action: innovations driving preventive care.",
        speaker: { name: "Dr. Nikhil Tandon", role: "Director", company: "AIIMS", flag: "🇮🇳" }
      },
      {
        time: "04:00 PM - 05:00 PM",
        session: "SESSION 6",
        type: "NETWORKING",
        topic: "Policy, Advocacy & Global Partnerships",
        description: "Working together for a healthier and equitable future.",
        speaker: { name: "Policy Leaders", role: "Health Ministers & Global Experts", company: "WHO", flag: "🌐" }
      }
    ]
  },
  featuredSpeakers: [
    { name: "Dr. Sanjay Gupta", role: "Chief Medical Correspondent", company: "CNN", image: "", category: "KEYNOTE SPEAKER" },
    { name: "Dr. Soumya Swaminathan", role: "Former Chief Scientist", company: "WHO", image: "", category: "KEYNOTE SPEAKER" },
    { name: "Luke Coutinho", role: "Holistic Lifestyle Expert", company: "Speaker", image: "", category: "SPEAKER" },
    { name: "Dr. R. Balakrishnan", role: "Director", company: "PHFI", image: "", category: "PANELIST" },
    { name: "Dr. Nikhil Tandon", role: "Director", company: "AIIMS", image: "", category: "SPEAKER" },
    { name: "Dr. Sangita Reddy", role: "Joint MD", company: "Apollo Hospitals", image: "", category: "PANELIST" }
  ],
  cta: {
    bePartTitle: "Be Part Of Day 3",
    bePartDescription: "Join leaders and innovators shaping the future of preventive healthcare.",
    delegatePass: { title: "Delegate Pass", description: "Access all 3 days of conferences, networking & more." },
    sponsor: { title: "Sponsor & Partner", description: "Showcase your brand and connect with global health leaders." }
  },
  isActive: true
};

const seedDay3 = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Day 3 seeding...");
    await ConferenceDay.findOneAndUpdate(
      { dayNumber: 3 },
      { $set: day3Data },
      { upsert: true, new: true }
    );
    console.log("Seeded Day 3 successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Day 3:", error);
    process.exit(1);
  }
};

seedDay3();
