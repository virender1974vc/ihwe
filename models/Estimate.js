const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const estimateInstalmentSchema = new mongoose.Schema(
  {
    // The Event Setup payment-plan phase id this instalment came from (e.g.
    // "advance") — kept so an edited PI can match its saved Remarks override
    // back to the right row even though the row itself is re-derived fresh
    // from the event's plan config on every load.
    id: { type: String, default: "" },
    label: { type: String, default: "" },
    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    remarks: { type: String, default: "" },
  },
  { _id: false },
);

const estimateItemSchema = new mongoose.Schema({
  category: { type: String, default: "" },
  plScheme: { type: String, default: "" },
  stallType: { type: String, default: "" },
  description: { type: String, required: true },
  hsn: { type: String, required: true, default: "998596" },
  qty: { type: Number, required: true },
  size: { type: Number, required: true },
  area: { type: String, default: "" },
  unit: { type: String, required: true },
  depth: { type: String, default: "" },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  disc: { type: Number, required: true },
  tax: { type: Number, required: true },
  gstRate: { type: String, required: true },
  cgst: { type: String, default: "" },
  cgst_per: { type: String, default: "9" },
  igst_per: { type: String, default: "9" },
  finalAmount: { type: Number, required: true },
  remarks: { type: String, default: "" },
});

const estimateSchema = new mongoose.Schema(
  {
    est_type: { type: String },
    companyId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    crmEventId: { type: mongoose.Schema.Types.ObjectId, ref: "CrmEvent", default: null },
    exhibitorRegistrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorRegistration", default: null },
    revisionOf: { type: mongoose.Schema.Types.ObjectId, ref: "Estimate", default: null },
    version: { type: Number, default: 1 },
    est_no: { type: String, required: true, unique: true },
    gst_no: { type: String },
    company_name: { type: String, default: "" },
    company_addr: { type: String, default: "" },
    company_gst_no: { type: String, default: "" },
    event_name: { type: String, default: "" },
    event_place_of_supply: { type: String, default: "" },
    event_gst_no: { type: String, default: "" },
    supply_date: { type: String },
    consignee_name: { type: String, required: true },
    consignee_addr: { type: String, required: true },
    consignee_person: { type: String, default: "" },
    consignee_phone: { type: String, default: "" },
    consignee_email: { type: String, default: "" },
    consignee_country: { type: String, default: "" },
    consignee_state: { type: String, default: "" },
    consignee_city: { type: String, default: "" },
    consignee_pincode: { type: String, default: "" },
    company_contact_person: { type: String, default: "" },
    company_contact_mobile: { type: String, default: "" },
    company_email: { type: String, default: "" },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: Number, required: true },
    items: { type: [estimateItemSchema], required: true }, // Array of items
    finalAmount: { type: Number },
    paymentPlanType: { type: String, default: "" },
    paymentPlanLabel: { type: String, default: "" },
    // Preferential Location Charge — a % of the primary stall's base cost,
    // folded into finalAmount but also stored on its own for the invoice's
    // "Additional Charges" breakdown.
    plcPct: { type: Number, default: 0 },
    plcCharges: { type: Number, default: 0 },
    plcGstPct: { type: Number, default: 0 },
    plcGstAmount: { type: Number, default: 0 },
    plcFinalAmount: { type: Number, default: 0 },
    tdsApplicable: { type: Boolean, default: true },
    tdsLines: { type: [String], default: [] },
    instalments: { type: [estimateInstalmentSchema], default: [] },
    remarks: { type: String, default: "" },
    terms: { type: String, default: "" },
    added_by: { type: String },
    status: { type: String, default: "active" },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    whatsappSent: { type: Boolean, default: false },
    whatsappSentAt: { type: Date },
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
estimateSchema.statics.generateNextEstimateNo = async function () {
  const fiscalYear = getFiscalYear();
  const prefix = `NGW/${fiscalYear}/PI/`;

  const lastEstimate = await this.findOne({
    est_no: { $regex: `^${prefix}` },
  }).sort({ added: -1 });

  let nextSeq = 1;
  if (lastEstimate) {
    const lastParts = lastEstimate.est_no.split("/");
    const lastNum = parseInt(lastParts[lastParts.length - 1], 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}${padded}`;
};

estimateSchema.index({ companyId: 1, eventId: 1, status: 1, added: -1 });
estimateSchema.index({ exhibitorRegistrationId: 1 });

module.exports = secondaryDB.model("Estimate", estimateSchema);
