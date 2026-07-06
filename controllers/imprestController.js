const ImprestRequest = require("../models/ImprestRequest");

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getImprestRequests = async (req, res) => {
  try {
    const requests = await ImprestRequest.find().sort({ requestDate: -1, createdAt: -1 }).lean();
    const summary = requests.reduce((acc, item) => {
      acc.totalRequested += numberValue(item.requestedAmount);
      acc.totalApproved += numberValue(item.approvedAmount);
      acc.totalReimbursed += numberValue(item.reimbursedAmount);
      if (item.status === "Pending Approval") acc.totalPending += numberValue(item.requestedAmount);
      if (item.status === "Reimbursed") acc.reimbursedCount += 1;
      if (item.status === "Approved") acc.approvedCount += 1;
      if (item.status === "Pending Approval") acc.pendingCount += 1;
      if (item.status === "Rejected") acc.rejectedCount += 1;
      const settlementEnd = item.settledAt || item.reimbursedAt;
      if (settlementEnd && item.submittedAt) {
        acc.settlementDays.push(Math.max(0, Math.round(
          (new Date(settlementEnd) - new Date(item.submittedAt)) / 86400000,
        )));
      }
      return acc;
    }, {
      totalRequested: 0,
      totalApproved: 0,
      totalReimbursed: 0,
      totalPending: 0,
      reimbursedCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      settlementDays: [],
    });

    summary.averageSettlementDays = summary.settlementDays.length
      ? Number((summary.settlementDays.reduce((sum, days) => sum + days, 0) / summary.settlementDays.length).toFixed(1))
      : 0;
    delete summary.settlementDays;

    res.json({ success: true, data: requests, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load imprest requests", error: error.message });
  }
};

const getImprestRequestById = async (req, res) => {
  try {
    const request = await ImprestRequest.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ success: false, message: "Imprest request not found" });
    return res.json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load imprest request", error: error.message });
  }
};

const createImprestRequest = async (req, res) => {
  try {
    const requestDate = req.body.requestDate || new Date();
    const status = req.body.status === "Draft" ? "Draft" : "Pending Approval";
    const attachment = req.file ? {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      url: `/uploads/imprest/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
    } : null;

    const request = await ImprestRequest.create({
      ...req.body,
      requestNo: await ImprestRequest.generateRequestNo(requestDate),
      requestedAmount: numberValue(req.body.requestedAmount),
      approvedAmount: 0,
      reimbursedAmount: 0,
      requestDate,
      status,
      submittedAt: status === "Pending Approval" ? new Date() : null,
      attachment,
    });

    return res.status(201).json({
      success: true,
      message: status === "Draft" ? "Imprest request saved as draft" : "Imprest request submitted",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Failed to create imprest request" });
  }
};

const updateImprestStatus = async (req, res) => {
  try {
    const { status, approvedAmount, reimbursedAmount, approverRemarks } = req.body;
    const updates = { status, approverRemarks: approverRemarks || "" };
    if (approvedAmount !== undefined) updates.approvedAmount = numberValue(approvedAmount);
    if (reimbursedAmount !== undefined) updates.reimbursedAmount = numberValue(reimbursedAmount);
    if (status === "Approved") updates.approvedAt = new Date();
    if (status === "Reimbursed") {
      updates.reimbursedAt = new Date();
      updates.settledAt = new Date();
    }
    const request = await ImprestRequest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!request) return res.status(404).json({ success: false, message: "Imprest request not found" });
    return res.json({ success: true, message: "Imprest request updated", data: request });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Failed to update imprest request" });
  }
};

module.exports = {
  getImprestRequests,
  getImprestRequestById,
  createImprestRequest,
  updateImprestStatus,
};
