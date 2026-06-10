const mongoose = require('mongoose');

const GlimpseImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  altText: { type: String, default: "" },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const GlimpseCounterSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  number: { type: String, required: true },
  label: { type: String, required: true },
  order: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const glimpseSchema = new mongoose.Schema({
  subheading: { type: String, default: "Event Glimpses" },
  heading: { type: String, default: "BEST MOMENTS – IHWE 2026" },
  highlightText: { type: String, default: "BEST MOMENTS" },
  description: { type: String, default: "A glimpse into the energy, innovation, and success of IHWE 2026." },
  images: [GlimpseImageSchema],
  counters: [GlimpseCounterSchema],
  counterText: { type: String, default: "Relive the moments that inspired connections and created impact" },
  updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('Glimpse', glimpseSchema);

