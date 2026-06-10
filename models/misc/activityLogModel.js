const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    user: {
      type: String, // Store username for easier display
      required: true,
    },
    action: {
      type: String, // Created, Updated, Deleted, Logged In
      required: true,
    },
    module: {
      type: String, // Section / Module Name
      required: true,
    },
    details: {
      type: String, // Specific log details
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    ip_address: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("ActivityLog", activityLogSchema);
