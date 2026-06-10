const mongoose = require("mongoose");
const { secondaryDB } = require('../../config/secondaryDb');

const CrmExhibatorReviewSchema = new mongoose.Schema(
  {
    cmpny_id: { type: String, required: true },
    evnt_id: { type: String, default: "1" },
    event_name: { type: String },
    status_short: { type: String },
    reminder_dt: { type: String },
    forward_to: { type: String },
    re_msg: { type: String },
    type: {
      type: String,
      enum: ["status", "whatsapp", "call", "email", "email_reply", "log"],
      default: "status",
    },
    email_subject: { type: String },
    email_content: { type: String },
    attachments: [{ type: String }],
    call_duration: { type: String },
    follow_up_date: { type: String },
    message_id: { type: String },
    updated_by: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = secondaryDB.model(
  "CrmExhibatorReview2023",
  CrmExhibatorReviewSchema
);
