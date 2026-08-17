const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const getFiscalYear = (forDate) => {
  const date = forDate ? new Date(forDate) : new Date();
  if (isNaN(date.getTime())) return getFiscalYear();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

const paymentAdjustmentSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    adjustment_no: { type: String, required: true, unique: true },
    adjustment_date: { type: String, required: true },

    // adjustAgainst mirrors adjustmentType's target document so the UI/table can filter on
    // it directly without re-deriving it from adjustmentType every time.
    adjustmentType: {
      type: String,
      enum: ["against_invoice", "against_performa_invoice", "against_estimate", "against_credit_note", "against_debit_note", "write_off"],
      required: true,
    },
    adjustAgainst: { type: String, enum: ["Invoice", "Performa Invoice", "Estimate", "Credit Note", "Debit Note"], required: true },

    referenceId: { type: String, default: "" },
    referenceNo: { type: String, default: "" },
    clientName: { type: String, default: "" },

    amount: { type: Number, required: true, default: 0 },
    reason: { type: String, required: true },
    adjustedBy: { type: String, default: "Admin" },

    // Document lifecycle state, same convention as AccountDebitNote/CreditNote.
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

paymentAdjustmentSchema.statics.generateNextAdjustmentNo = async function (forDate) {
  const fiscalYear = getFiscalYear(forDate);
  const prefix = `NGW/ADJ/${fiscalYear}/`;

  const lastAdjustment = await this.findOne({
    adjustment_no: { $regex: `^${prefix}` },
  }).sort({ added: -1 });

  let nextSeq = 1;
  if (lastAdjustment) {
    const lastParts = lastAdjustment.adjustment_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}${padded}`;
};

module.exports = secondaryDB.model("PaymentAdjustment", paymentAdjustmentSchema);
