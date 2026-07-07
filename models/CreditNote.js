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
    reference_invoice_no: { type: String },
    invoice_date: { type: String },
    credit_note_type: { type: String },
    credit_note_date: { type: String },
    reason: { type: String },
    event: { type: String },
    hall_stall: { type: String },
    gstin: { type: String },
    remarks: { type: String },
    sub_total: { type: Number },
    gst_reversal: { type: Number },
    total_value: { type: Number },
    adjusted_amount: { type: Number },
    remaining_balance: { type: Number },
    adjusted_invoices: { type: [mongoose.Schema.Types.Mixed] },

    companyId: { type: String, required: true },

    items: { type: [creditItemSchema], required: true },

    added_by: { type: String, required: true },

    status: { type: String, default: "active" },

    attachment: { type: String, default: "" },

    updated_date: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

module.exports = secondaryDB.model("CreditNote", creditNoteSchema);
