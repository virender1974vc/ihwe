const mongoose = require('mongoose');

const newTestimonialVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String },
  videoUrl: { type: String, required: true },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('NewTestimonialVideo', newTestimonialVideoSchema);
