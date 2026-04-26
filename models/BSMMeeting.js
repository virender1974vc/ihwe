const mongoose = require("mongoose");

const bsmMeetingSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyerRegistration",
      required: true,
    },
    exhibitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorRegistration",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    date: {
      type: Date,
    },
    timeSlot: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },
    requestedBy: {
      type: String,
      enum: ["Admin", "Exhibitor", "Buyer"],
      required: true,
    },
    // Dual approval tracking
    exhibitorApproval: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    buyerApproval: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    location: {
      type: String,
    },
    remarks: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BSMMeeting", bsmMeetingSchema);
