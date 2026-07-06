const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PosterPresentation = require('./models/PosterPresentation');

dotenv.config();

const guidelines = [
  "Poster size should be 90 cm (width) x 120 cm (height) in portrait orientation.",
  "Poster should be clear, self-explanatory and visually attractive.",
  "Use large fonts and high-resolution images for better visibility.",
  "Include title, authors, affiliation, introduction, methods, results, conclusion and references.",
  "All posters must be in English.",
  "Presenting author must be present at the poster during the assigned time.",
  "Posters should be mounted at the assigned board number."
];

const topics = [
  { icon: "Lightbulb", title: "Healthcare Technology & Innovation" },
  { icon: "Hospital", title: "Healthcare Management" },
  { icon: "MonitorSmartphone", title: "AI & Digital Health" },
  { icon: "Stethoscope", title: "Nursing & Patient Care" },
  { icon: "HeartPulse", title: "Public Health & Epidemiology" },
  { icon: "Apple", title: "Nutrition & Dietetics" },
  { icon: "BriefcaseMedical", title: "Medical Devices & Diagnostics" },
  { icon: "Leaf", title: "Environmental Health" },
  { icon: "Pill", title: "Pharmaceutical Sciences" },
  { icon: "Scale", title: "Policy, Ethics & Education" },
  { icon: "Brain", title: "Mental Health & Wellbeing" },
  { icon: "FlaskConical", title: "Other Allied Health Sciences" }
];

const importantNotes = [
  "Poster presenters must register for the conference.",
  "Presenters will get 5-7 minutes to present their poster to the evaluators.",
  "Stand near your poster during the assigned time for discussion.",
  "E-certificate will be provided to all poster presenters."
];

const timeline = [
  { title: "Abstract Submission", date: "01 May - 30 June 2026", icon: "Calendar" },
  { title: "Abstract Acceptance", date: "05 July 2026", icon: "ShieldCheck" },
  { title: "Poster Submission", date: "10 July - 31 July 2026", icon: "Upload" },
  { title: "Review Process", date: "01 Aug - 15 Aug 2026", icon: "FileText" },
  { title: "Notification of Acceptance", date: "20 Aug 2026", icon: "Bell" },
  { title: "Registration Deadline", date: "25 Aug 2026", icon: "BadgeCheck" },
  { title: "Poster Display Date", date: "21 August 2026", icon: "Users" }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI);

        await PosterPresentation.deleteMany();

        await PosterPresentation.create({
            guidelines,
            topics,
            importantNotes,
            timeline
        });

        console.log('Poster Presentation Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

seedData();
