const mongoose = require('mongoose');

const parallaxSchema = new mongoose.Schema({
  subheading: {
    type: String,
    default: "Join The Movement"
  },
  heading: {
    type: String,
    default: "Shaping the Future of Global Healthcare"
  },
  highlightText: {
    type: String,
    default: "Global Healthcare"
  },
  description: {
    type: String,
    default: "Connect with innovators and healthcare leaders driving the next generation of medical excellence worldwide."
  },
  buttonText: {
    type: String,
    default: "Join the Expo"
  },
  buttonUrl: {
    type: String,
    default: "/exhibition"
  },
  imageUrl: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model('Parallax', parallaxSchema);
