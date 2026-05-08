const mongoose = require("mongoose");
const ConferenceDay = require("../models/ConferenceDay");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/arogyasangosti";

const day1Data = {
  dayNumber: 1,
  hero: {
    title: "HEALTHCARE",
    subtitle: "INNOVATION SUMMIT",
    date: "21 August 2026",
    category: "Day 1",
    description: "Advancing technology, infrastructure & innovation for future-ready healthcare systems.",
    backgroundImage: "",
    stats: [
      { label: "SESSIONS", value: "6 POWER-PACKED" },
      { label: "SPEAKERS", value: "WORLD-CLASS" },
      { label: "NETWORKING", value: "UNMATCHED" }
    ]
  },
  about: {
    title: "ABOUT DAY 1",
    description: "The Healthcare Innovation Summit brings together visionaries, technologists, clinicians, and industry leaders to explore the latest advancements shaping the future of healthcare.",
    descriptionSecondary: "From smart hospitals to AI-powered diagnostics, this summit focuses on building resilient, efficient, and patient-centric healthcare systems.",
    focusAreas: [
      "Smart Hospitals & Digital Transformation",
      "Medical Devices & Innovation",
      "AI, HealthTech & Digital Health",
      "Diagnostics, Labs & Precision Medicine",
      "Healthcare Infrastructure & Investment",
      "Leadership, Policy & Global Collaboration"
    ]
  },
  agenda: {
    title: "DAY 1 AGENDA — 20 AUGUST 2026",
    subtitle: "6 Insightful Sessions | 1 Powerful Day",
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        session: "SESSION 1",
        type: "KEYNOTE",
        topic: "Inaugural Keynote – Future of Global Healthcare",
        description: "Global outlook on healthcare transformation, innovation, and future opportunities.",
        speaker: { name: "Dr. Randal Pinkett", role: "Former Chief Health Officer", company: "Amazon", flag: "🇺🇸" }
      },
      {
        time: "11:00 AM - 11:45 AM",
        session: "SESSION 2",
        type: "PANEL",
        topic: "Smart Hospitals & Digital Transformation",
        description: "Building intelligent, connected, and efficient hospitals for next-generation care.",
        speaker: { name: "Dr. Maria Neira", role: "Director, Department of Environment", company: "WHO", flag: "🌐" }
      },
      {
        time: "12:00 PM - 12:45 PM",
        session: "SESSION 3",
        type: "EXPERT TALK",
        topic: "Medical Devices & Innovation Showcase",
        description: "Next-gen medical devices improving outcomes and patient safety.",
        speaker: { name: "Dr. Kevin Tan", role: "Founder & CEO", company: "HealthTech Asia", flag: "🇸🇬" }
      },
      {
        time: "02:00 PM - 02:45 PM",
        session: "SESSION 4",
        type: "PANEL",
        topic: "AI, HealthTech & Digital Health Solutions",
        description: "AI, data, and digital platforms redefining healthcare delivery.",
        speaker: { name: "Dr. Devi Shetty", role: "Chairman & Founder", company: "Narayana Health", flag: "🇮🇳" }
      },
      {
        time: "03:00 PM - 03:45 PM",
        session: "SESSION 5",
        type: "EXPERT TALK",
        topic: "Diagnostics, Labs & Precision Medicine",
        description: "Advances in diagnostics and personalized medicine for better health outcomes.",
        speaker: { name: "Prof. Mark Woolhouse", role: "Professor of Infectious Disease", company: "University of Edinburgh", flag: "🇬🇧" }
      },
      {
        time: "04:00 PM - 05:00 PM",
        session: "SESSION 6",
        type: "NETWORKING",
        topic: "Investor Networking & Leadership Forum",
        description: "Connect with investors, innovators, and healthcare leaders for impactful collaborations.",
        speaker: { name: "Industry Leaders", role: "Innovators", company: "Healthcare Executives", flag: "🌐" }
      }
    ]
  },
  featuredSpeakers: [
    { name: "Dr. Maria Neira", role: "Director, Environment", company: "WHO", image: "", category: "PANELIST" },
    { name: "Dr. Kevin Tan", role: "Founder & CEO", company: "HealthTech Asia", image: "", category: "SPEAKER" },
    { name: "Dr. Devi Shetty", role: "Chairman & Founder", company: "Narayana Health", image: "", category: "PANELIST" },
    { name: "Prof. Mark Woolhouse", role: "Professor", company: "University of Edinburgh", image: "", category: "SPEAKER" },
    { name: "Dr. Chaiyavat Chaiyasut", role: "CEO", company: "BDMS Wellness Clinic", image: "", category: "SPEAKER" },
    { name: "Dr. Randal Pinkett", role: "Former Chief Health Officer", company: "Amazon", image: "", category: "KEYNOTE SPEAKER" }
  ],
  cta: {
    bePartTitle: "Be Part Of Day 1",
    bePartDescription: "Start your journey towards a holistic future.",
    delegatePass: { title: "Delegate Pass", description: "Full access to all Day 1 sessions and workshops." },
    sponsor: { title: "Sponsor Day 1", description: "Showcase your holistic solutions to a global audience." }
  },
  isActive: true
};

const seedDay1 = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Day 1 seeding...");
    await ConferenceDay.findOneAndUpdate(
      { dayNumber: 1 },
      { $set: day1Data },
      { upsert: true, new: true }
    );
    console.log("Seeded Day 1 successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Day 1:", error);
    process.exit(1);
  }
};

seedDay1();
