const mongoose = require("mongoose");

const GalleryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: true,
      enum: ["photo", "video", "press"],
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },
    image: {
      type: String,
      required: function() {
        return this.mediaType === "image" || (this.mediaType === "video" && !this.videoUrl);
      },
    },
    videoUrl: {
      type: String, // YouTube link or internal path
      required: function() {
        return this.mediaType === "video" && !this.image;
      },
    },
    imageAlt: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryItem", GalleryItemSchema);
