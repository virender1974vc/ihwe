const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const ReminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },
    targetAudience: {
      type: String,
      enum: ["all", "selected", "user", "confirmed_exhibitor"],
      required: true
    },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorRegistration" }],
    audioUrl: { type: String, default: "" },
    type: {
      type: String,
      enum: ["instant", "scheduled"],
      required: true
    },
    scheduledFor: { type: Date },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorRegistration" }],
    createdBy: { type: String, required: true }
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } }
);

module.exports = secondaryDB.model("Reminder", ReminderSchema);
