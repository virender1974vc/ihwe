const mongoose = require('mongoose');

const paperPresentationSchema = new mongoose.Schema({
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

const PaperPresentation = mongoose.model('PaperPresentation', paperPresentationSchema);

module.exports = PaperPresentation;
