const mongoose = require('mongoose');

const expoPointSchema = new mongoose.Schema({
  text: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const expoCardSchema = new mongoose.Schema({
  icon: { type: String, default: 'Globe' },
  goldTitle: { type: String, required: true },
  whiteTitle: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const nationalExpoSchema = new mongoose.Schema({
  subtitle: { type: String, default: 'From India to the World' },
  title: { type: String, default: 'From a National Expo to a Global Platform' },
  description: { type: String, default: 'The 9th Edition – Global Edition marks a strategic evolution of IHWE, designed to attract:' },
  bgImage: { type: String },
  altText: { type: String, default: 'World Map Background' },
  points: [expoPointSchema],
  cards: [expoCardSchema]
}, { timestamps: true });

module.exports = mongoose.model('NationalExpo', nationalExpoSchema);
