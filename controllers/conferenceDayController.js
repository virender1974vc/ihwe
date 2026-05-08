const ConferenceDay = require("../models/ConferenceDay");

// Get data for all days (Hardcoded for now)
exports.getAllConferenceDays = async (req, res) => {
  try {
    const conferenceData = [
      {
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
      },
      {
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
      },
      {
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
      }
    ];
    res.status(200).json({ success: true, data: conferenceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get data for a specific day (Hardcoded for now)
exports.getConferenceDay = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const day = parseInt(dayNumber);

    const conferenceData = {
      1: {
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
      },
      2: {
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
      },
      3: {
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
      }
    };

    const data = conferenceData[day];
    if (!data) {
      return res.status(404).json({ success: false, message: "Day content not found" });
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
