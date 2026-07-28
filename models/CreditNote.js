const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const creditItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  cn_amount: { type: Number, required: true },
  cedit_note_remark: { type: String, default: "" },

  // Richer per-item breakdown for the formal Credit Note printout — optional so
  // existing records (which only ever populated the legacy fields above) still work.
  hsn: { type: String, default: "" },
  unit: { type: String, default: "Nos" },
  rate: { type: Number },
  gstPct: { type: String, default: "18%" },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number },

  // Stall dimension fields, carried over from the source invoice item when the
  // Credit Note is auto-populated from a Reference Invoice — same shape/naming
  // as Invoice.items so the printout table can render identically to the invoice.
  area: { type: String, default: "" },
  size: { type: String, default: "" },
  discountPct: { type: Number },
  taxableValue: { type: Number },
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

    // Document-level totals for the formal printout (mirrors AccountDebitNote's shape)
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    adjustment_type: { type: String, default: "Against Invoice" },
    preparedBy: {
      name: { type: String, default: "" },
      designation: { type: String, default: "" },
    },
    reviewedBy: {
      name: { type: String, default: "" },
      designation: { type: String, default: "" },
    },

    companyId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },

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
