const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  speakers: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "Session",
  },
});

const conferenceAgendaSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },
    shortTitle: {
      type: String,
      required: true,
    },
    sessions: [sessionSchema],
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConferenceAgenda", conferenceAgendaSchema);
