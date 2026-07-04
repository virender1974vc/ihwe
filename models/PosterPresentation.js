const mongoose = require('mongoose');

const posterPresentationSchema = new mongoose.Schema({
  guidelines: [{
    type: String
  }],
  topics: [{
    icon: String,
    title: String
  }],
  importantNotes: [{
    type: String
  }],
  timeline: [{
    title: String,
    date: String,
    icon: String
  }]
}, { timestamps: true });

const PosterPresentation = mongoose.model('PosterPresentation', posterPresentationSchema);

module.exports = PosterPresentation;
