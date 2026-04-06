const mongoose = require('mongoose');

const GlimpseImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  altText: { type: String, default: "" },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const glimpseSchema = new mongoose.Schema({
  subheading: { type: String, default: "Event Glimpses" },
  heading: { type: String, default: "Witness the Legacy of Innovation" },
  highlightText: { type: String, default: "Legacy of Innovation" },
  description: { type: String, default: "A curated showcase of transformative moments and groundbreaking milestones from a decade of healthcare excellence." },
  images: [GlimpseImageSchema],
  updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('Glimpse', glimpseSchema);

