const mongoose = require("mongoose");

const VacancySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    experience: { type: String, required: true },
    salary: { type: String, default: "Not disclosed" },
    location: { type: String, required: true },
    description: { type: String },
    requirements: [{ type: String }],
    vacancyCount: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vacancy", VacancySchema);
