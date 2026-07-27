const mongoose = require('mongoose');

const introFeatureSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  number: { type: String, required: true },
  label: { type: String, required: true },
  order: { type: Number, default: 0 },
  updatedBy: { type: String, default: 'System' },
  updatedAt: { type: Date, default: Date.now }
});

const introductionSchema = new mongoose.Schema({
  subtitle: { type: String, default: 'INTRODUCTION' },
  title: { type: String, default: 'A Global Platform for Health, Wellness & Integrated Healthcare' },
  description: { type: String, default: 'International Health & Wellness Expo 2026 stands as India\'s most influential international platform...' },
  image: { type: String },
  altText: { type: String },
  bgColor: { type: String, default: '#ffffff' },
  features: [introFeatureSchema]
}, { timestamps: true });

module.exports = mongoose.model('Introduction', introductionSchema);
