const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const estimateItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, required: true },
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
  cgst_per: { type: String, default: "" },
  igst_per: { type: String, default: "" },
  finalAmount: { type: Number, required: true },
  remarks: { type: String, default: "" },
});

const estimateSchema = new mongoose.Schema(
  {
    est_type: { type: String, required: true },
    companyId: { type: String, required: true },
    est_no: { type: String, required: true, unique: true },
    gst_no: { type: String, required: true },
    supply_date: { type: String, required: true },
    consignee_name: { type: String, required: true },
    consignee_addr: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: Number, required: true },
    items: { type: [estimateItemSchema], required: true }, // Array of items
    added_by: { type: String, required: true },
    status: { type: String, default: "active" },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("Estimate", estimateSchema);
