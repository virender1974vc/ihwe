const mongoose = require('mongoose');

const abstractPresentationSchema = new mongoose.Schema({
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

const AbstractPresentation = mongoose.model("AbstractPresentation", abstractPresentationSchema);

module.exports = AbstractPresentation;
