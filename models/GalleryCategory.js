const mongoose = require("mongoose");

const GalleryCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    heading: {
      type: String,
      required: false,
      trim: true,
    },
    coverImage: {
      type: String,
      required: false,
    },
    coverImageAlt: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["gallery", "media"],
      default: "gallery",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryCategory", GalleryCategorySchema);
