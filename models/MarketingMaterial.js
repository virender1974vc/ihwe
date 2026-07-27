const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const marketingMaterialSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "Brochure",
        "Poster",
        "Testimonials",
        "Videos",
        "Website Links",
        "Office Location",
        "Venue Location",
        "Marketing PPT",
        "Social Media Posts",
        "Sponsorship Proposal",
        "Marketing Proposal",
        "Booking Form",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ["PDF", "Image", "Video", "Link", "PPT", "Word", "Location"],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: String,
      default: "",
    },
    totalPages: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
    updatedBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = secondaryDB.model("MarketingMaterial", marketingMaterialSchema);
