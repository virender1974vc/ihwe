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
  category: { type: String, default: "" },
  plScheme: { type: String, default: "" },
  stallType: { type: String, default: "" },
});

const invoiceAttachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const invoiceDeliveryChallanItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    hsn: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    unit: { type: String, default: "" },
  },
  { _id: false },
);

const invoiceDeliveryChallanSchema = new mongoose.Schema(
  {
    delivery_challan_id: { type: String, required: true },
    challan_no: { type: String, required: true },
    challan_date: { type: String, default: "" },
    status: { type: String, default: "" },
    delivery_address: { type: String, default: "" },
    transporter_name: { type: String, default: "" },
    vehicle_no: { type: String, default: "" },
    eway_bill: { type: String, default: "" },
    bilty_no: { type: String, default: "" },
    items: { type: [invoiceDeliveryChallanItemSchema], default: [] },
  },
  { _id: false },
);

const invoiceRevisionSchema = new mongoose.Schema(
  {
    revision: { type: Number, required: true },
    revised_at: { type: Date, default: Date.now },
    revised_by: { type: String, default: "" },
    reason: { type: String, default: "" },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const InvoiceSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    crmEventId: { type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent", default: null, index: true },
    source_estimate_id: { type: String, default: "" },
    estimate_no: { type: String, default: "" }, // Optional now
    invoice_no: { type: String, required: true, unique: true }, 
    type_of_invoice: { type: String, required: true },
    invoice_date: { type: String },
    po_no: { type: String },
    po_date: { type: Date, default: null },
    po_attachment: { type: invoiceAttachmentSchema, default: null },
    eway_bill_no: { type: String, default: "" },
    currency: { type: String },
    payment_terms: { type: String, default: "" },
    payment_status: { type: String, enum: ["", "pending", "partial", "paid"], default: "" },
    payment_due_date: { type: Date, default: null },
    show_payment_details: { type: Boolean, default: true },
    
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
    consignee_person: { type: String, default: "" },
    consignee_phone: { type: String, default: "" },
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
    delivery_challan_ids: { type: [String], default: [] },
    delivery_challans: { type: [invoiceDeliveryChallanSchema], default: [] },
    remarks: { type: String, default: "" },
    terms: { type: String, default: "" },
    attachments: { type: [invoiceAttachmentSchema], default: [] },
    revision_no: { type: Number, default: 0 },
    revised_at: { type: Date, default: null },
    revisions: { type: [invoiceRevisionSchema], default: [] },
    
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
