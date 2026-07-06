const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

// Helper: Get fiscal year in YY-YY format for a given date (defaults to now)
const getFiscalYear = (forDate) => {
  const date = forDate ? new Date(forDate) : new Date();
  if (isNaN(date.getTime())) return getFiscalYear();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

const debitNoteItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    hsn: { type: String, default: "" },
    qty: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "Nos" },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
    gstPct: { type: String, default: "18%" },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// One debit note can be split across multiple invoices — each allocation records
// what that invoice's outstanding balance was AT THE TIME the debit note was raised,
// so settlement status can later be computed honestly (see accountDebitNoteController).
const allocationSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true },
    invoiceNo: { type: String, default: "" },
    invoiceDate: { type: String, default: "" },
    invoiceAmount: { type: Number, default: 0 },
    outstandingBeforeDN: { type: Number, default: 0 },
    appliedAmount: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const accountDebitNoteSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    debit_note_no: { type: String, required: true, unique: true },
    debit_note_date: { type: String },

    debitNoteType: {
      type: String,
      enum: ["additional_charges", "late_fee", "expense_recovery", "tds_shortfall", "other"],
      default: "additional_charges",
    },
    reason: { type: String, required: true },
    reference: { type: String, default: "" },
    clientName: { type: String, default: "" },

    items: { type: [debitNoteItemSchema], required: true },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    allocations: { type: [allocationSchema], required: true },
    tdsDeduction: { type: Number, default: 0 },
    adjustmentCreditNote: { type: Number, default: 0 },

    remarks: { type: String, required: true },
    attachmentUrl: { type: String, default: "" },

    // Document lifecycle state — distinct from settlement/collection status,
    // which is computed dynamically from allocations vs. current invoice outstanding.
    status: { type: String, enum: ["draft", "active", "cancelled"], default: "active" },
    added_by: { type: String, default: "Admin" },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

accountDebitNoteSchema.statics.generateNextDebitNoteNo = async function (forDate) {
  const fiscalYear = getFiscalYear(forDate);
  const prefix = `NGW/DN/${fiscalYear}/`;

  const lastNote = await this.findOne({
    debit_note_no: { $regex: `^${prefix}` },
  }).sort({ added: -1 });

  let nextSeq = 1;
  if (lastNote) {
    const lastParts = lastNote.debit_note_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}${padded}`;
};

module.exports = secondaryDB.model("AccountDebitNote", accountDebitNoteSchema);
