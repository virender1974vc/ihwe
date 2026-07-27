const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AbstractPresentation = require('./models/AbstractPresentation');

dotenv.config();

const initialData = {
  guidelines: [
    "Abstract must be original and not published or presented elsewhere.",
    "Word limit: 250 - 300 words.",
    "Use structured format: Background, Objectives, Methods, Results, Conclusion.",
    "Use Times New Roman font, 12pt size, single line spacing.",
    "Do not include author names or affiliations in the abstract.",
    "Use standard abbreviations and avoid uncommon abbreviations.",
    "Submit your abstract in MS Word format (.doc/.docx).",
    "All submissions are subject to a review process.",
  ],
  topics: [
    { icon: "Lightbulb", title: "Healthcare Technology & Innovation" },
    { icon: "Stethoscope", title: "Nursing & Patient Care" },
    { icon: "MonitorSmartphone", title: "AI & Digital Health" },
    { icon: "Apple", title: "Nutrition & Dietetics" },
    { icon: "HeartPulse", title: "Public Health & Epidemiology" },
    { icon: "Leaf", title: "Environmental Health" },
    { icon: "BriefcaseMedical", title: "Medical Devices & Diagnostics" },
    { icon: "Scale", title: "Policy, Ethics & Education" },
    { icon: "Pill", title: "Pharmaceutical Sciences" },
    { icon: "Hospital", title: "Health Economics & Outcomes" },
    { icon: "Brain", title: "Mental Health & Wellbeing" },
    { icon: "FlaskConical", title: "Other Allied Health Sciences" },
    { icon: "Hospital", title: "Healthcare Management" },
  ],
  importantNotes: [
    "Only registered participants are eligible to submit an abstract.",
    "Each presenter will be notified of acceptance status via email.",
    "E-certificate will be provided to all presenting authors.",
  ],
  timeline: [
    { title: "Abstract Submission", date: "01 May - 30 June 2026", icon: "Calendar" },
    { title: "Abstract Acceptance", date: "05 July 2026", icon: "ShieldCheck" },
    { title: "Full Paper Submission", date: "10 July - 31 July 2026", icon: "Upload" },
    { title: "Review Process", date: "01 Aug - 15 Aug 2026", icon: "FileText" },
    { title: "Notification of Acceptance", date: "20 Aug 2026", icon: "Bell" },
    { title: "Registration Deadline", date: "25 Aug 2026", icon: "BadgeCheck" },
    { title: "Presentation Date", date: "21 August 2026", icon: "Users" },
  ]
};

mongoose.connect(process.env.MONGO_URI_MAIN)
.then(async () => {
  console.log('MongoDB Connected');
  
  // Clear existing
  await AbstractPresentation.deleteMany({});
  
  // Insert new
  await AbstractPresentation.create(initialData);
  
  console.log('Abstract Presentation data seeded successfully!');
  process.exit();
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
