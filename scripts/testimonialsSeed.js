const mongoose = require("mongoose");
const ConferenceTestimonial = require("../models/ConferenceTestimonial");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/arogyasangosti";

const testimonialsData = {
  subheading: "VOICES FROM",
  heading: "INDUSTRY LEADERS",
  highlightText: "LEADERS",
  description: "Global leaders and visionaries share their experiences and insights from IHWE 2026.",
  cards: [
    {
      name: "Dr. Randal Pinkett",
      role: "Former Chief Health Officer",
      company: "Amazon Healthcare",
      feedback: "IHWE 2026 has set a new benchmark for healthcare conferences. The integration of technology and holistic wellness is precisely what the industry needs today. A truly visionary platform.",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
      order: 1
    },
    {
      name: "Dr. Maria Neira",
      role: "Director, Dept. of Environment",
      company: "WHO",
      feedback: "The focus on planetary health and sustainable healthcare systems at this conference is remarkable. It's a privilege to connect with so many dedicated professionals in one space.",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      order: 2
    },
    {
      name: "Dr. Devi Shetty",
      role: "Chairman & Founder",
      company: "Narayana Health",
      feedback: "Innovative, inclusive, and impactful. IHWE provides an unmatched opportunity to discuss the future of accessible healthcare with global experts. Every session was a learning experience.",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5,
      order: 3
    },
    {
      name: "Ms. Sophia Laurent",
      role: "CEO, Global Beauty & Wellness",
      company: "L'Oréal",
      feedback: "An incredible fusion of beauty, personal care, and preventive health. The networking opportunities here are strategic and highly valuable for anyone in the wellness economy.",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 5,
      order: 4
    },
    {
      name: "Dr. Kevin Tan",
      role: "Founder & CEO",
      company: "HealthTech Asia",
      feedback: "As a technologist, I found the Digital Health and AI showcases to be world-class. IHWE is where the latest innovations in health tech meet real-world clinical expertise.",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 5,
      order: 5
    },
    {
      name: "Dr. Ananya Sharma",
      role: "Director – AYUSH Initiatives",
      company: "Ministry of AYUSH",
      feedback: "Representing the traditional wisdom of Ayurveda alongside modern science has been a highlight. IHWE successfully bridges the gap between ancient healing and modern medicine.",
      image: "https://randomuser.me/api/portraits/women/25.jpg",
      rating: 5,
      order: 6
    },
    {
      name: "Luke Coutinho",
      role: "Holistic Lifestyle Expert",
      company: "Integrative Wellness",
      feedback: "IHWE is the most comprehensive platform I've seen that truly understands the power of preventive lifestyle medicine. The energy and collaboration here are infectious.",
      image: "https://randomuser.me/api/portraits/men/11.jpg",
      rating: 5,
      order: 7
    },
    {
      name: "Dr. Michael Lee",
      role: "Lifestyle Medicine Specialist",
      company: "Harvard Medical School",
      feedback: "The quality of research and evidence-based discussions at IHWE is exceptional. It’s a must-attend event for anyone serious about the future of preventive healthcare.",
      image: "https://randomuser.me/api/portraits/men/54.jpg",
      rating: 5,
      order: 8
    }
  ]
};

const seedTestimonials = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // Helper to generate initials
    const generateInitials = (name) => {
      const parts = name.trim().split(" ");
      let initials = parts[0][0].toUpperCase();
      if (parts.length > 1) {
        initials += parts[parts.length - 1][0].toUpperCase();
      }
      return initials;
    };

    // Add initials to all cards
    const cardsWithInitials = testimonialsData.cards.map(card => ({
      ...card,
      initials: generateInitials(card.name)
    }));

    const dataToSeed = {
      ...testimonialsData,
      cards: cardsWithInitials
    };

    console.log("Seeding testimonials data...");
    await ConferenceTestimonial.deleteMany({}); // Clear existing data
    await ConferenceTestimonial.create(dataToSeed);

    console.log("Seeding complete! 8 high-quality testimonials have been added.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedTestimonials();
