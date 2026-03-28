const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmLoginLogSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    browser: { type: String, required: true },
    platform: { type: String, required: true },
    ip_address: { type: String, required: true },
    login_time: { type: Date, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "login_time", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("CrmLoginLog", CrmLoginLogSchema);
