const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  time: String,
  session: String, // e.g., SESSION 1
  type: String,    // e.g., KEYNOTE, PANEL
  topic: String,
  description: String,
  speaker: {
    name: String,
    role: String,
    company: String,
    image: String,
    flag: String
  }
});

const featuredSpeakerSchema = new mongoose.Schema({
  name: String,
  role: String,
  company: String,
  image: String,
  category: String // e.g., KEYNOTE SPEAKER, PANELIST
});

const conferenceDaySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      unique: true, // 1, 2, or 3
    },
    hero: {
      title: String,
      subtitle: String,
      date: String,
      category: String,
      description: String,
      backgroundImage: String,
      stats: [
        {
          label: String,
          value: String,
        },
      ],
    },
    about: {
      title: String,
      description: String,
      descriptionSecondary: String,
      focusAreas: [String],
    },
    agenda: {
      title: String,
      subtitle: String,
      sessions: [sessionSchema],
    },
    featuredSpeakers: [featuredSpeakerSchema],
    cta: {
      bePartTitle: String,
      bePartDescription: String,
      delegatePass: {
        title: String,
        description: String,
      },
      sponsor: {
        title: String,
        description: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConferenceDay", conferenceDaySchema);
