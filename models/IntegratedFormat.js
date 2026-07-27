const mongoose = require('mongoose');

const formatCardSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  cardNumber: { type: String }, // e.g. "01"
  order: { type: Number, default: 0 }
});

const highlightSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const integratedFormatSchema = new mongoose.Schema({
  subtitle: { type: String, default: 'OUR COMPREHENSIVE' },
  title: { type: String, default: 'INTEGRATED FORMAT' },
  description: { type: String, default: 'The 9th International Health & Wellness Expo brings together innovation...' },
  leafColor: { type: String, default: '#23471d' },
  cards: [formatCardSchema],
  highlights: [highlightSchema]
}, { timestamps: true });

module.exports = mongoose.model('IntegratedFormat', integratedFormatSchema);
