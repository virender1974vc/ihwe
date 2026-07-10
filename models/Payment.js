const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const getFiscalYear = (forDate) => {
  const date = forDate ? new Date(forDate) : new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

const paymentSchema = new mongoose.Schema(
  {
    ex_no: { type: String, default: "" },
    receipt_no: { type: String, default: "" },
    companyId: { type: String, default: "" },
    invoice_id: { type: String, required: true },
    f_amount: { type: String, required: true },
    amount_text: { type: String, required: true },
    tds_text: { type: String, default: "" },
    payment_date: { type: String, required: true },
    debit_note_no: { type: String, default: "" },
    debit_note_ammount: { type: String, default: "" },
    debit_note_date: { type: String, default: "" },
    pymnt_type: { type: String, default: "" },
    payment_mode: { type: String, required: true },
    cash_receipt_no: { type: String, default: "" },
    cheque_name: { type: String, default: "" },
    cheque_no: { type: String, default: "" },
    cheque_date: { type: String, default: "" },
    cheque_bank: { type: String, default: "" },
    card_type: { type: String, default: "" },
    card_name: { type: String, default: "" },
    card_transaction_no: { type: String, default: "" },
    card_last_digit: { type: String, default: "" },
    card_date: { type: String, default: "" },
    card_bank: { type: String, default: "" },
    wallet_name: { type: String, default: "" },
    wallet_transaction_no: { type: String, default: "" },
    wallet_mobile: { type: String, default: "" },
    neft_bank: { type: String, default: "" },
    utr_no: { type: String, default: "" },
    bankId: { type: String, default: "" },
    neft_date: { type: String, default: "" },
    status: { type: Number, default: 1 },
    added_by: { type: String, default: "Admin" },
    proofUrl: { type: String, default: "" },
    tds_rate: { type: String, default: "" },
    tds_section: { type: String, default: "" },
    tds_certificate_no: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

// Unlike other document-number fields, receipt_no defaults to "" and legacy payments
// (recorded before the Receipts feature existed) still have it blank, so a plain
// `unique: true` would fail to index / reject those records. A partial unique index
// enforces uniqueness only once a real receipt number is set, closing the race where
// two payments recorded around the same time could silently get the identical
// auto-generated receipt_no.
paymentSchema.index(
  { receipt_no: 1 },
  { unique: true, partialFilterExpression: { receipt_no: { $gt: "" } } }
);

// Static method: Auto-generate next Receipt number in RCP/YY-YY/NNNN format
paymentSchema.statics.generateNextReceiptNo = async function (forDate) {
  const fiscalYear = getFiscalYear(forDate);
  const prefix = `RCP/${fiscalYear}/`;

  const lastPayment = await this.findOne({
    receipt_no: { $regex: `^${prefix}` },
  }).sort({ receipt_no: -1 });

  let nextSeq = 1;
  if (lastPayment) {
    const lastParts = lastPayment.receipt_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  const padded = String(nextSeq).padStart(4, "0");
  return `${prefix}${padded}`;
};

module.exports = secondaryDB.model("Payment", paymentSchema);
