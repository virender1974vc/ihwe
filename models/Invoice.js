const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
// ✅ Helper: Get current fiscal year in YY-YY format
const getFiscalYear = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based index (1=Jan, 4=Apr)
  // Fiscal year starts in April (month >= 4)
  const startYear = month >= 4 ? currentYear : currentYear - 1;
  const endYear = month >= 4 ? currentYear + 1 : currentYear;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

const InvoiceSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    estimate_no: { type: String, required: true },
    invoice_no: { type: String, required: true }, // यह फील्ड अब ऑटो-जेनरेट होगी
    type_of_invoice: { type: String, required: true },
    gst_no: { type: String, required: true },
    supply_date: { type: String, required: true },
    consignee_name: { type: String, required: true },
    consignee_addr: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    stateCode: { type: String },
    added_by: { type: String, required: true },
    status: { type: String, default: "active" },
    added: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

// ✅ Static method: Auto-generate next Invoice number
InvoiceSchema.statics.generateNextInvoiceNumber = async function () {
  const fiscalYear = getFiscalYear();
  // आपका वांछित प्रारूप: NGW/INV/YY-YY/XXX
  const prefix = `NGW/INV/${fiscalYear}/`;

  // इस fiscal year के लिए सबसे नया Invoice ढूंढें
  const lastInvoice = await this.findOne({
    invoice_no: { $regex: `^${prefix}` },
  }).sort({ added: -1 });

  let nextSeq = 1;
  if (lastInvoice) {
    const lastParts = lastInvoice.invoice_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  // नंबर को 3-अंकों के साथ पैड करें (e.g., 001, 026)
  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}${padded}`;
};

module.exports = secondaryDB.model("Invoice", InvoiceSchema);
