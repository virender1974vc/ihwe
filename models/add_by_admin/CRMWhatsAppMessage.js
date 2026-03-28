const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const WhatsAppMessageSchema = new mongoose.Schema(
  {
    msg_name: { type: String, required: true },
    file_attach: { type: String }, // will store filename (not full path)
    msg_descr: { type: String, required: true },
    msg_status: { type: String, default: "inactive" },
    msg_added: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "msg_added", updatedAt: "msg_updated" } },
);

module.exports = secondaryDB.model("WhatsAppMessage", WhatsAppMessageSchema);
