const ConferenceDay = require("../models/ConferenceDay");

// Get data for all days
exports.getAllConferenceDays = async (req, res) => {
  try {
    const data = await ConferenceDay.find().sort({ dayNumber: 1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get data for a specific day
exports.getConferenceDay = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const data = await ConferenceDay.findOne({ dayNumber: parseInt(dayNumber) });
    if (!data) {
      return res.status(200).json({ success: false, message: "Day content not found" });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update or Create data for a specific day
exports.updateConferenceDay = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const updateData = req.body;

    const data = await ConferenceDay.findOneAndUpdate(
      { dayNumber: parseInt(dayNumber) },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: "Content updated successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload image for conference
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const imageUrl = `/uploads/conference/${req.file.filename}`;
    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initial Seeding for Day 3 (using provided content)
exports.seedInitialData = async (req, res) => {
  try {
    const day3Data = {
      dayNumber: 3,
      hero: {
        title: "Wellness & Ayush",
        subtitle: "Leadership Forum",
        date: "23 August 2026",
        category: "Day 3",
        description: "Strengthening prevention, public health & sustainability for a healthier planet.",
        backgroundImage: "/uploads/day3-bg.png",
        stats: [
          { label: "SESSIONS", value: "6 IMPACTFUL" },
          { label: "EXPERTS", value: "GLOBAL" },
          { label: "NETWORKING", value: "STRATEGIC" }
        ]
      },
      about: {
        title: "About Day 3",
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
        subtitle: "6 Insightful Sessions  |  1 Powerful Day",
        sessions: [
          {
            time: "10:00 AM – 10:45 AM",
            session: "SESSION 1",
            type: "KEYNOTE",
            topic: "Ayurveda & Traditional Wisdom",
            description: "Deep dive into ancient healing systems and their global relevance.",
            speaker: {
              name: "Dr. Sanjay Gupta",
              role: "Prev. Chief Medical",
              company: "Correspondent, CNN",
              image: "https://randomuser.me/api/portraits/men/20.jpg",
              flag: "🇺🇸"
            }
          },
          {
            time: "11:00 AM – 11:45 AM",
            session: "SESSION 2",
            type: "PANEL",
            topic: "Nutrition, Diet & Lifestyle",
            description: "Personalized nutrition and dietary habits for long-term health.",
            speaker: {
              name: "Dr. Soumya Swaminathan",
              role: "Prev. Chief Scientist",
              company: "WHO",
              image: "https://randomuser.me/api/portraits/women/21.jpg",
              flag: "🇮🇳"
            }
          }
        ]
      },
      featuredSpeakers: [
        {
          name: "Dr. Sanjay Gupta",
          role: "Prev. Chief Medical",
          company: "Correspondent, CNN",
          image: "https://randomuser.me/api/portraits/men/20.jpg",
          category: "KEYNOTE SPEAKER"
        }
      ],
      cta: {
        bePartTitle: "Be Part Of Day 3",
        bePartDescription: "Join leaders and innovators shaping the future of preventive healthcare.",
        delegatePass: {
          title: "Delegate Pass",
          description: "Access all 3 days of conferences, networking & more."
        },
        sponsor: {
          title: "Sponsor & Partner",
          description: "Showcase your brand and connect with global health leaders."
        }
      }
    };

    await ConferenceDay.findOneAndUpdate(
      { dayNumber: 3 },
      { $set: day3Data },
      { upsert: true }
    );

    res.status(200).json({ success: true, message: "Initial data seeded" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a specific day
exports.deleteConferenceDay = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const result = await ConferenceDay.findOneAndDelete({ dayNumber: parseInt(dayNumber) });
    if (!result) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }
    res.status(200).json({ success: true, message: "Day deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
