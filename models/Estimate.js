const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const estimateItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, required: true, default: "998596" },
  qty: { type: Number, required: true },
  size: { type: Number, required: true },
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
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: Number, required: true },
    items: { type: [estimateItemSchema], required: true }, // Array of items
    finalAmount: { type: Number },
    added_by: { type: String },
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

module.exports = secondaryDB.model("Estimate", estimateSchema);
