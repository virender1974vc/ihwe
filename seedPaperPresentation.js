const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PaperPresentation = require('./models/PaperPresentation');

dotenv.config();

const guidelines = [
  "Papers must be original and not published or presented elsewhere.",
  "Abstract should be between 250–300 words.",
  "Full paper should be between 2500–3500 words.",
  "Submit your paper in MS Word format (.doc/.docx).",
  "Use Times New Roman font, 12pt size, 1.5 line spacing.",
  "Include a cover page with title, authors, affiliations, and contact details.",
  "All submissions are subject to a double-blind peer review process.",
  "Presenting author must register for the conference."
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
  "Only registered participants are eligible to present their papers.",
  "Each presenter will get 10–12 minutes for presentation followed by Q&A.",
  "Certificates will be provided to all presenting authors."
];

const timeline = [
  { title: "Abstract Submission", date: "01 May - 30 June 2026", icon: "Calendar" },
  { title: "Abstract Acceptance", date: "05 July 2026", icon: "ShieldCheck" },
  { title: "Full Paper Submission", date: "10 July - 31 July 2026", icon: "Upload" },
  { title: "Review Process", date: "01 Aug - 15 Aug 2026", icon: "FileText" },
  { title: "Notification of Acceptance", date: "20 Aug 2026", icon: "Bell" },
  { title: "Registration Deadline", date: "25 Aug 2026", icon: "BadgeCheck" },
  { title: "Presentation Date", date: "21 August 2026", icon: "Users" }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_MAIN || process.env.MONGO_URI);

        await PaperPresentation.deleteMany();

        await PaperPresentation.create({
            guidelines,
            topics,
            importantNotes,
            timeline
        });

        console.log('Paper Presentation Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

seedData();
