const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const PerformaInvoiceSchema = new mongoose.Schema(
  {
    est_no: { type: String, required: true },
    companyId: { type: String, required: true },
    pi_no: { type: String, required: true },
    finalAmount: { type: Number, required: true },
    added: { type: Date, required: true },
    updated: { type: Date, default: null },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

// ✅ Helper: Get current fiscal year in YY-YY format
const getFiscalYear = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

// ✅ Static method: Auto-generate next PI number
PerformaInvoiceSchema.statics.generateNextPINumber = async function () {
  const fiscalYear = getFiscalYear();
  const prefix = `NGW/${fiscalYear}/PI/`;

  const lastInvoice = await this.findOne({
    pi_no: { $regex: `^${prefix}` },
  }).sort({ added: -1 });

  let nextSeq = 1;
  if (lastInvoice) {
    const lastParts = lastInvoice.pi_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}${padded}`;
};

module.exports = secondaryDB.model("PerformaInvoice", PerformaInvoiceSchema);
