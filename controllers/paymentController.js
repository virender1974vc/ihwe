const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const PerformaInvoice = require("../models/PerformaInvoice");
const { logActivity } = require("../utils/logger");
const { getAccountNameById, getDocumentAccountName } = require("../utils/accountActivityDetails");

const resolvePaymentAccount = async (payment) => {
  if (payment.companyId) {
    return {
      companyId: payment.companyId,
      accountName: await getAccountNameById(payment.companyId, "account"),
    };
  }
  if (!payment.invoice_id) return { companyId: "", accountName: "account" };

  const doc =
    await Invoice.findById(payment.invoice_id).lean() ||
    await Estimate.findById(payment.invoice_id).lean() ||
    await PerformaInvoice.findById(payment.invoice_id).lean();

  return {
    companyId: doc?.companyId || "",
    accountName: await getDocumentAccountName(doc, "account"),
  };
};

// ➤ Add a new payment
const addPayment = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.proofUrl = `/uploads/payment_proofs/${req.file.filename}`;
    }
    const payment = new Payment(payload);
    await payment.save();
    const { accountName } = await resolvePaymentAccount(payment);
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Added Payment for ${accountName}. Amount: ₹${payment.amount_text || 0}`,
    );

    res.status(201).json({
      message: "Payment added successfully",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding payment",
      error: error.message,
    });
  }
};

// ➤ Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ added: -1 }).lean();

    const mongoose = require("mongoose");
    const validInvoiceIds = payments.map(p => p.invoice_id).filter(id => id && mongoose.Types.ObjectId.isValid(id));
    const invoices = await Invoice.find({ _id: { $in: validInvoiceIds } }, "invoice_no").lean();
    const estimates = await Estimate.find({ _id: { $in: validInvoiceIds } }, "est_no").lean();
    const proformas = await PerformaInvoice.find({ _id: { $in: validInvoiceIds } }, "est_no").lean();

    const invoiceMap = {};
    invoices.forEach(i => invoiceMap[i._id.toString()] = i.invoice_no);
    estimates.forEach(e => invoiceMap[e._id.toString()] = e.est_no);
    proformas.forEach(p => invoiceMap[p._id.toString()] = p.est_no);

    const populatedPayments = payments.map(p => ({
      ...p,
      invoice_no: invoiceMap[p.invoice_id] || p.invoice_id
    }));

    res.status(200).json(populatedPayments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// ➤ Get a single payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

// ➤ Update payment
const updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' },
    );

    if (!updatedPayment)
      return res.status(404).json({ message: "Payment not found" });
    const { accountName } = await resolvePaymentAccount(updatedPayment);
    await logActivity(
      req,
      "Updated",
      "Accounts",
      `Updated Payment for ${accountName}. Amount: ₹${updatedPayment.amount_text || 0}`,
    );

    res.status(200).json({
      message: "✏️ Payment updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating payment",
      error: error.message,
    });
  }
};

// ➤ Delete payment
const deletePayment = async (req, res) => {
  try {
    const deletedPayment = await Payment.findByIdAndDelete(req.params.id);

    if (!deletedPayment)
      return res.status(404).json({ message: "Payment not found" });
    const { accountName } = await resolvePaymentAccount(deletedPayment);
    await logActivity(
      req,
      "Deleted",
      "Accounts",
      `Deleted Payment for ${accountName}. Amount: ₹${deletedPayment.amount_text || 0}`,
    );

    res.status(200).json({
      message: "🗑️ Payment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting payment",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};
