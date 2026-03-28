const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const VisitorReviewSchema = new mongoose.Schema(
  {
    visitor_id: { type: String, required: true },
    visitor_status: { type: String, required: true },
    visitor_event: { type: String, required: true },
    visitor_desc: { type: String, required: true },
    added_by: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("VisitorReview", VisitorReviewSchema);
