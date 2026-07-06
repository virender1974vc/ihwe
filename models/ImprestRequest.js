const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: "" },
    fileName: { type: String, default: "" },
    url: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const imprestRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, unique: true, index: true },
    requestType: {
      type: String,
      enum: ["Advance Request", "Expense Claim", "Reimbursement"],
      required() { return this.status !== "Draft"; },
    },
    purpose: { type: String, required() { return this.status !== "Draft"; }, trim: true },
    detailedPurpose: { type: String, default: "", trim: true, maxlength: 500 },
    department: { type: String, required() { return this.status !== "Draft"; }, trim: true },
    employeeName: { type: String, required() { return this.status !== "Draft"; }, trim: true },
    employeeId: { type: String, required() { return this.status !== "Draft"; }, trim: true },
    designation: { type: String, default: "", trim: true },
    requestDate: { type: Date, required() { return this.status !== "Draft"; } },
    requiredByDate: { type: Date, required() { return this.status !== "Draft"; } },
    currency: { type: String, default: "INR" },
    requestedAmount: { type: Number, required() { return this.status !== "Draft"; }, min: 0, default: 0 },
    approvedAmount: { type: Number, default: 0, min: 0 },
    reimbursedAmount: { type: Number, default: 0, min: 0 },
    expenseHead: { type: String, required() { return this.status !== "Draft"; }, trim: true },
    remarks: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Rejected", "Reimbursed"],
      default: "Pending Approval",
      index: true,
    },
    attachment: { type: attachmentSchema, default: null },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    reimbursedAt: { type: Date, default: null },
    settledAt: { type: Date, default: null },
    approverName: { type: String, default: "Finance Manager" },
    approverRemarks: { type: String, default: "" },
    addedBy: { type: String, default: "Admin" },
  },
  { timestamps: true },
);

imprestRequestSchema.statics.generateRequestNo = async function (forDate = new Date()) {
  const date = new Date(forDate);
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  const fiscalYear = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
  const prefix = `IMP/${fiscalYear}/`;
  const last = await this.findOne({ requestNo: { $regex: `^${prefix}` } })
    .sort({ requestNo: -1 })
    .lean();
  const lastSequence = Number(String(last?.requestNo || "").split("/").pop()) || 0;
  return `${prefix}${String(lastSequence + 1).padStart(4, "0")}`;
};

module.exports = secondaryDB.model("ImprestRequest", imprestRequestSchema);
