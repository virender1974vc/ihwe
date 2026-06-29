const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const debitNoteItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, default: "" },
  qty: { type: Number, required: true, default: 1 },
  unit: { type: String, default: "Nos" },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  gstPct: { type: String, default: "18%" },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
});

const debitNoteSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    debit_note_no: { type: String, required: true, unique: true },
    debit_note_date: { type: String },

    toInvoiceId: { type: String, default: "" },
    toInvoiceNo: { type: String, default: "" },
    toDocumentType: { type: String, enum: ["Invoice", "Proforma Invoice", ""], default: "" },

    clientName: { type: String, default: "" },
    originalAmount: { type: Number, default: 0 },

    reason: { type: String, default: "" },
    reference: { type: String, default: "" },
    type: {
      type: String,
      enum: ["additional_charges", "expense_recovery", "price_revision", "other_adjustment"],
      default: "additional_charges",
    },

    items: { type: [debitNoteItemSchema], required: true },

    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    remarks: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },

    added_by: { type: String, default: "Admin" },
    status: { type: String, default: "active" },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

const getFiscalYear = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

debitNoteSchema.statics.generateNextDebitNoteNo = async function () {
  const fiscalYear = getFiscalYear();
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

module.exports = secondaryDB.model("DebitNote", debitNoteSchema);
