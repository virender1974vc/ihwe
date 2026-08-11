const mongoose = require("mongoose");

const PdfManagerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    category: { type: String, default: "E-Brochure" },
    subCategory: { type: String, default: "" },
    sourceType: { type: String, default: "" },
    sourceEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PdfManager", PdfManagerSchema);
