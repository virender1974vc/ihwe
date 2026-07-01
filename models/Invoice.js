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

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, default: "" },
  qty: { type: Number, required: true },
  size: { type: String, default: "" },
  area: { type: String, default: "" },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  discountPct: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true },
  gstPct: { type: String, required: true },
  gstAmount: { type: Number, required: true },
  total: { type: Number, required: true },
});

const InvoiceSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    source_estimate_id: { type: String, default: "" },
    estimate_no: { type: String, default: "" }, // Optional now
    invoice_no: { type: String, required: true, unique: true }, 
    type_of_invoice: { type: String, required: true },
    invoice_date: { type: String },
    due_date: { type: String },
    po_no: { type: String },
    currency: { type: String },
    
    gst_no: { type: String },
    supply_date: { type: String }, // Can be used as invoice date if not separate

    company_name: { type: String },
    company_addr: { type: String },
    company_gst_no: { type: String },
    event_name: { type: String },
    event_place_of_supply: { type: String },
    event_gst_no: { type: String },
    
    consignee_name: { type: String, required: true },
    consignee_addr: { type: String }, // Shipping
    billing_address: { type: String },
    billing_state: { type: String },
    billing_pincode: { type: String },
    
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    place_of_supply: { type: String },
    stateCode: { type: String },
    
    items: { type: [invoiceItemSchema], required: true },
    finalAmount: { type: Number, required: true },
    remarks: { type: String, default: "" },
    terms: { type: String, default: "" },
    
    added_by: { type: String },
    status: { type: String, default: "active" },
    added: { type: Date, default: Date.now },
    updated: { type: Date, default: null },
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
