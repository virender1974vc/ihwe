const mongoose = require("mongoose");

const CareerSchema = new mongoose.Schema(
  {
    vacancy_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vacancy" },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String },
    document: { type: String }, // path to CV
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "contacted"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Career", CareerSchema);
