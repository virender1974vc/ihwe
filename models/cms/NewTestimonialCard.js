const mongoose = require('mongoose');

const newTestimonialCardSchema = new mongoose.Schema({
  quote: { type: String, required: true },
  logo: { type: String }, // Card Top Image (Logo)
  logoAlt: { type: String, default: 'Logo' },
  company1: { type: String, required: true },
  company2: { type: String },
  location: { type: String, required: true },
  color: { type: String, default: '#23471d' },
  bottomImage: { type: String }, // Card Bottom Image
  bottomImageAlt: { type: String, default: 'Bottom Decoration' },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('NewTestimonialCard', newTestimonialCardSchema);
