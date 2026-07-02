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
    backgroundImage: "https://yourdomain.com/images/day3-hero.jpg",

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

  agenda: {
    title: "Conference Agenda",
    subtitle: "Day 3 Schedule",
    sessions: [
      {
        time: "09:00 AM",
        session: "SESSION 1",
        type: "KEYNOTE",
        topic: "The Future of Precision Medicine",
        description:
          "Latest innovations in personalized and precision healthcare.",
        speaker: {
          name: "Dr. Michael Johnson",
          role: "Director",
          company: "Cleveland Clinic",
          image: "https://yourdomain.com/speakers/michael.jpg",
          flag: "🇺🇸",
        },
      },
    ],
  },

  featuredSpeakers: [
    {
      name: "Dr. Michael Johnson",
      role: "Director",
      company: "Cleveland Clinic",
      image: "https://yourdomain.com/speakers/michael.jpg",
      category: "KEYNOTE SPEAKER",
    },
  ],

  ourSpeakers: [
    {
      name: "Dr. Priya Sharma",
      role: "Healthcare Innovation Lead",
      company: "Apollo Hospitals",
      image: "https://yourdomain.com/speakers/priya.jpg",
      category: "WORKSHOP SPEAKER",
    },
  ],

  cards: [
    {
      title: "Research Awards",
      text: "Recognizing outstanding healthcare research.",
      link: "/research-awards",
    },
  ],

  associates: [
    "https://yourdomain.com/logos/logo1.png",
    "https://yourdomain.com/logos/logo2.png",
  ],

  healthcareHighlights: {
    features: [
      {
        title: "Award Ceremony",
        description: "Celebrating excellence in healthcare innovation.",
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