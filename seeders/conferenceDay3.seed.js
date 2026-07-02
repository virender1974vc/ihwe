require("dotenv").config();
const mongoose = require("mongoose");
const ConferenceDay = require("../models/ConferenceDay");

const day3Data = {
  dayNumber: 3,

  hero: {
    title: "Global Healthcare Innovation Summit",
    subtitle: "Collaboration, Research & Closing Ceremony",
    date: "23 August 2026",
    category: "Day 3",
    description:
      "The final day celebrates innovation, research excellence, strategic collaborations, and the future roadmap of global healthcare.",
    backgroundImage: "/uploads/conference/conf-1782890059543.webp",

    stats: [
      { label: "Keynote Sessions", value: "5" },
      { label: "Research Papers", value: "80+" },
      { label: "Countries", value: "30+" },
      { label: "Networking Events", value: "12" },
    ],

    features: [
      {
        title: "Awards",
        subTitle: "Recognizing Excellence",
      },
      {
        title: "Research",
        subTitle: "Global Collaboration",
      },
      {
        title: "Future Vision",
        subTitle: "Healthcare 2035",
      },
    ],
  },

  about: {
    title: "About Day 3",
    description:
      "Day 3 focuses on research presentations, global collaborations, innovation awards, and the closing ceremony.",
    descriptionSecondary:
      "Participants will exchange ideas, build partnerships, and celebrate healthcare excellence.",
    focusAreas: [
      "Clinical Research",
      "Precision Medicine",
      "Healthcare Innovation",
      "Medical Education",
      "Global Partnerships",
    ],
  },

  sessions: [
    {
      time: "09:00 AM",
      session: "SESSION 1",
      type: "KEYNOTE",
      topic: "The Future of Precision Medicine",
      description: "Latest innovations in personalized healthcare.",
      speaker: {
        name: "Dr. Michael Johnson",
        role: "Director",
        company: "Cleveland Clinic",
        image: "/uploads/conference/conf-1782890158871.webp",
        flag: "🇺🇸",
      },
    },
    {
      time: "10:15 AM",
      session: "SESSION 2",
      type: "PANEL",
      topic: "Digital Health Transformation",
      description: "Experts discuss AI and telemedicine.",
      speaker: {
        name: "Prof. Sarah Williams",
        role: "Professor",
        company: "Johns Hopkins University",
        image: "/uploads/conference/conf-1782890158871.webp",
        flag: "🇬🇧",
      },
    },
    {
      time: "11:45 AM",
      session: "SESSION 3",
      type: "FIRESIDE CHAT",
      topic: "Future of Healthcare Startups",
      description: "Investors and founders discuss innovation.",
      speaker: {
        name: "Dr. Ahmed Hassan",
        role: "Chief Medical Officer",
        company: "Dubai Healthcare City",
        image: "/uploads/conference/conf-1782890158871.webp",
        flag: "🇦🇪",
      },
    },
    {
      time: "02:00 PM",
      session: "SESSION 4",
      type: "WORKSHOP",
      topic: "Leadership in Modern Healthcare",
      description: "Interactive leadership workshop.",
      speaker: {
        name: "Dr. Priya Sharma",
        role: "Healthcare Innovation Lead",
        company: "Apollo Hospitals",
        image: "/uploads/conference/conf-1782890158871.webp",
        flag: "🇮🇳",
      },
    },
    {
      time: "04:00 PM",
      session: "SESSION 5",
      type: "CLOSING CEREMONY",
      topic: "Awards & Closing Remarks",
      description: "Conference awards and closing address.",
      speaker: {
        name: "Dr. Maria Fernandez",
        role: "Innovation Director",
        company: "WHO",
        image: "/uploads/conference/conf-1782890158871.webp",
        flag: "🇪🇸",
      },
    },
  ],

  featuredSpeakers: [
    {
      name: "Dr. Michael Johnson",
      role: "Director",
      company: "Cleveland Clinic",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "KEYNOTE SPEAKER",
    },
    {
      name: "Prof. Sarah Williams",
      role: "Professor of Oncology",
      company: "Johns Hopkins University",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "INTERNATIONAL SPEAKER",
    },
    {
      name: "Dr. Ahmed Hassan",
      role: "Chief Medical Officer",
      company: "Dubai Healthcare City",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "PANELIST",
    },
    {
      name: "Dr. Maria Fernandez",
      role: "Healthcare Innovation Director",
      company: "WHO",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "GUEST SPEAKER",
    },
  ],

  ourSpeakers: [
    {
      name: "Dr. Priya Sharma",
      role: "Healthcare Innovation Lead",
      company: "Apollo Hospitals",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "WORKSHOP SPEAKER",
    },
    {
      name: "Dr. Rajesh Verma",
      role: "Senior Cardiologist",
      company: "AIIMS Delhi",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "SPEAKER",
    },
    {
      name: "Dr. Neha Kapoor",
      role: "Research Scientist",
      company: "Fortis Healthcare",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "PANELIST",
    },
    {
      name: "Prof. Anil Mehta",
      role: "Medical Educator",
      company: "Manipal University",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "KEYNOTE SPEAKER",
    },
    {
      name: "Dr. Kavita Rao",
      role: "Director of Public Health",
      company: "Max Healthcare",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "MODERATOR",
    },
    {
      name: "Dr. Vikram Singh",
      role: "Healthcare Consultant",
      company: "Medanta",
      image: "/uploads/conference/conf-1782890158871.webp",
      category: "SPEAKER",
    },
  ],

  cards: [
    {
      title: "Academic Excellence",
      text: "Honouring educators and academic institutions.",
      link: "/academic-awards",
    },
    {
      title: "Innovation Showcase",
      text: "Present breakthrough healthcare technologies.",
      link: "/innovation-showcase",
    },
    {
      title: "Networking Lounge",
      text: "Meet industry leaders and healthcare professionals.",
      link: "/networking",
    },
  ],

  associates: [
    "/uploads/conference/conf-1782972810875.webp",
    "/uploads/conference/conf-1782972810875.webp",
    "/uploads/conference/conf-1782972810875.webp", "/uploads/conference/conf-1782972810875.webp",
    "/uploads/conference/conf-1782972810875.webp",
    "/uploads/conference/conf-1782972810875.webp",
  ],

  healthcareHighlights: {
    features: [
      {
        title: "Awards Ceremony",
        description: "Honouring healthcare leaders and innovators.",
      },
      {
        title: "Global Networking",
        description: "Build partnerships with healthcare professionals worldwide.",
      },
      {
        title: "Research Collaboration",
        description: "Connect researchers with institutions and investors.",
      },
      {
        title: "Innovation Showcase",
        description: "Experience the latest healthcare technologies.",
      },
      {
        title: "Closing Ceremony",
        description: "Celebrating achievements and announcing future initiatives.",
      },
    ],
  },

  cta: {
    bePartTitle: "See You Next Year!",
    bePartDescription:
      "Thank you for being part of the Global Healthcare Innovation Summit.",

    delegatePass: {
      title: "Stay Connected",
      description: "Join our future healthcare events.",
    },

    sponsor: {
      title: "Become Our Next Sponsor",
      description: "Partner with us in upcoming conferences.",
    },
  },

  isActive: true,
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI_MAIN);

  console.log("✅ Connected to DB");

  const exists = await ConferenceDay.findOne({ dayNumber: 3 });

  if (!exists) {
    await ConferenceDay.create(day3Data);
    console.log("✅ Day 3 created successfully");
  } else {
    await ConferenceDay.findOneAndUpdate(
      { dayNumber: 3 },
      day3Data,
      { new: true }
    );

    console.log("🔄 Day 3 updated successfully");
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});