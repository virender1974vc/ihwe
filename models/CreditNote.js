const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const creditItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  cn_amount: { type: Number, required: true },
  cedit_note_remark: { type: String, default: "" },
});

const creditNoteSchema = new mongoose.Schema(
  {
    create_note_no: { type: String, required: true, unique: true },

    est_no: { type: String, required: true },

    companyId: { type: String, required: true },

    items: { type: [creditItemSchema], required: true },

    added_by: { type: String, required: true },

    status: { type: String, default: "active" },

    updated_date: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

module.exports = secondaryDB.model("CreditNote", creditNoteSchema);
