const mongoose = require("mongoose");
require("dotenv").config();
const ConferenceAgenda = require("../models/ConferenceAgenda");

const agendaData = [
  {
    day: "DAY 1 | 21 AUG",
    shortTitle: "Healthcare Innovation Summit",
    order: 1,
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        topic: "Inaugural Keynote - Future of Global Healthcare",
        speakers: "Dr. Randal Pinkett",
        type: "Keynote",
      },
      {
        time: "11:00 AM - 11:45 AM",
        topic: "Smart Hospitals & Digital Transformation",
        speakers: "Dr. Maria Neira",
        type: "Panel",
      },
      {
        time: "12:00 PM - 12:45 PM",
        topic: "Medical Devices & Innovation Showcase",
        speakers: "Industry Experts",
        type: "Expert Talk",
      },
      {
        time: "02:00 PM - 02:45 PM",
        topic: "AI, HealthTech & Digital Health Solutions",
        speakers: "Dr. Devi Shetty",
        type: "Panel",
      },
      {
        time: "03:00 PM - 03:45 PM",
        topic: "Diagnostics, Labs & Precision Medicine",
        speakers: "Industry Experts",
        type: "Expert Talk",
      },
      {
        time: "04:00 PM - 05:00 PM",
        topic: "Investor Networking & Leadership Forum",
        speakers: "Open Networking",
        type: "Networking",
      },
    ],
  },
  {
    day: "DAY 2 | 22 AUG",
    shortTitle: "Global Wellness Leadership Forum",
    order: 2,
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        topic: "Holistic Healing in Modern Era",
        speakers: "Dr. Deepak Chopra",
        type: "Keynote",
      },
      {
        time: "11:00 AM - 11:45 AM",
        topic: "Ayurveda & Modern Medicine Integration",
        speakers: "Prof. Mark Woolhouse",
        type: "Panel",
      },
      {
        time: "12:00 PM - 12:45 PM",
        topic: "Wellness Tourism Opportunities",
        speakers: "Industry Leaders",
        type: "Expert Talk",
      },
    ],
  },
  {
    day: "DAY 3 | 23 AUG",
    shortTitle: "Future of Preventive Healthcare",
    order: 3,
    sessions: [
      {
        time: "10:00 AM - 10:45 AM",
        topic: "Building Resilient Health Systems",
        speakers: "WHO Delegates",
        type: "Keynote",
      },
      {
        time: "11:00 AM - 11:45 AM",
        topic: "Public Health & Sustainability",
        speakers: "Environment Experts",
        type: "Panel",
      },
    ],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);
    console.log("Connected to database for seeding...");

    await ConferenceAgenda.deleteMany({});
    console.log("Cleared existing agenda data.");

    await ConferenceAgenda.insertMany(agendaData);
    console.log("Successfully seeded conference agenda!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
