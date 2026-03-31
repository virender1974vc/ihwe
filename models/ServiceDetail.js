const mongoose = require("mongoose");

const ServiceDetailSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    unique: true,
  },
  bgImage: {
    type: String,
  },
  bgAltText: {
    type: String,
  },
  bgTitle: {
    type: String,
  },
  title: {
    type: String,
  },
  highlightText: {
    type: String,
  },
  description: {
    type: String,
  },
  galleryImages: [
    {
      url: String,
      altText: String,
    }
  ],
  seo: {
    metaTitle: String,
    metaKeywords: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    ogImageAltText: String,
    canonicalTag: String,
    schemaMarkup: String,
    openGraphTags: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("ServiceDetail", ServiceDetailSchema);
