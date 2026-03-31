const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmExhibatorReviewSchema = new mongoose.Schema(
  {
    cmpny_id: { type: String, required: true },
    evnt_id: { type: String, default: "1" },
    status_short: { type: String, required: true },
    reminder_dt: { type: String },
    forward_to: { type: String },
    re_msg: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "re_added", updatedAt: "re_updated" } },
);

module.exports = secondaryDB.model(
  "CrmExhibatorReview2023",
  CrmExhibatorReviewSchema,
);
