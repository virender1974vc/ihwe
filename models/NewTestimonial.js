const mongoose = require('mongoose');

const testimonialItemSchema = new mongoose.Schema({
  icon: { type: String, default: 'Quote' },
  cardTopImage: { type: String }, // Path for the top left image
  cardBottomImage: { type: String }, // Path for the bottom right image
  description: { type: String, required: true },
  authorName: { type: String, required: true },
  location: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const newTestimonialSchema = new mongoose.Schema({
  subtitle: { type: String, default: 'Testimonials' },
  heading: { 
    type: String, 
    default: 'Testimonials<br/>Real Voices.<br/>Real Impact.' 
  },
  description: { 
    type: String, 
    default: 'From innovation to collaboration, our global community shares how IHWE is driving meaningful connections, advancing healthcare, and building a healthier future for all.' 
  },
  leftBgImage: { type: String },
  leftBgAlt: { type: String, default: 'Left Pattern' },
  rightBgImage: { type: String },
  rightBgAlt: { type: String, default: 'Right Pattern' },
  highlightCardText: { 
    type: String, 
    default: 'Where global collaboration meets meaningful change. IHWE brings together brilliant minds, breakthrough ideas, and boundless opportunities —under one roof.' 
  },
  testimonials: [testimonialItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('NewTestimonial', newTestimonialSchema);
