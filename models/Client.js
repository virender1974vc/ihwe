const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  subheading: {
    type: String,
    default: "Join the Leaders"
  },
  heading: {
    type: String,
    default: "Our Exhibitors & Industry Partners"
  },
  highlightText: {
    type: String,
    default: "Exhibitors"
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    altText: {
      type: String,
      default: ""
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
