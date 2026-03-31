const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CommonWhatsappSchema = new mongoose.Schema(
  {
    compny_id: { type: String, required: true },
    phone_no: { type: String, required: true },
    whtsapp_title: { type: String, required: true },
    whtsapp_desc: { type: String, required: true },
    sent_files_img: { type: String, required: true },
    user: { type: String, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    added: { type: Date, required: true },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("CommonWhatsapp", CommonWhatsappSchema);
