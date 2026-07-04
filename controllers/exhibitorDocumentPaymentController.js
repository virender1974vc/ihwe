const mongoose = require("mongoose");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const Payment = require("../models/Payment");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");

const DOC_MODELS = { invoice: Invoice, proforma: Estimate };
const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";

// An exhibitor may have more than one registration (and a linked CRM Company);
// a document is payable by this exhibitor if its companyId matches any of those ids.
const getAuthorizedCompanyIds = async (user) => {
  const email = user.email;
  const mobile = user.mobile;
  let strippedMobile = mobile;
  if (mobile && mobile.startsWith("0")) strippedMobile = mobile.substring(1);

  const registrations = await ExhibitorRegistration.find({
    $or: [
      { "contact1.email": email },
      { "contact1.mobile": mobile },
      { "contact1.mobile": strippedMobile },
      { "contact1.mobile": "0" + strippedMobile },
    ],
  }).lean();

  const ids = new Set();
  registrations.forEach((reg) => {
    ids.add(String(reg._id));
    if (reg.clientId) ids.add(String(reg.clientId));
  });
  return ids;
};

const getOutstanding = async (doc, docId) => {
  const finalAmount = parseFloat(doc.finalAmount) || 0;
  const existingPayments = await Payment.find({ invoice_id: docId }).lean();
  const alreadyPaid = existingPayments.reduce((sum, p) => sum + (parseFloat(p.amount_text) || 0), 0);
  return { finalAmount, outstanding: Math.max(0, finalAmount - alreadyPaid) };
};

const createOrder = async (req, res) => {
  try {
    if (req.user.role !== "exhibitor") {
      return res.status(403).json({ success: false, message: "Access denied. Exhibitors only." });
    }

    const { docType, docId } = req.params;
    const Model = DOC_MODELS[docType];
    if (!Model || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: "Invalid document reference" });
    }

    const doc = await Model.findById(docId).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (isCancelledDoc(doc)) {
      return res.status(400).json({ success: false, message: "Cannot pay a cancelled document" });
    }

    const authorizedIds = await getAuthorizedCompanyIds(req.user);
    if (!authorizedIds.has(String(doc.companyId))) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { outstanding } = await getOutstanding(doc, docId);
    if (outstanding <= 0) {
      return res.status(400).json({ success: false, message: "This document has no outstanding balance" });
    }

    const amountInPaise = Math.round(outstanding * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `doc_${String(docId).substring(0, 8)}_${Date.now()}`,
      notes: { docType, docId: String(docId), companyId: String(doc.companyId) },
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID, amount: outstanding });
  } catch (error) {
    console.error("Exhibitor document create-order error:", error);
    res.status(500).json({
      success: false,
      message: error?.error?.description || error?.message || "Failed to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    if (req.user.role !== "exhibitor") {
      return res.status(403).json({ success: false, message: "Access denied. Exhibitors only." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, docType, docId } = req.body;
    const Model = DOC_MODELS[docType];
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !Model || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: "Missing or invalid payment verification fields" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const doc = await Model.findById(docId).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const authorizedIds = await getAuthorizedCompanyIds(req.user);
    if (!authorizedIds.has(String(doc.companyId))) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Trust Razorpay's own record of what was actually captured, never a client-supplied amount.
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const paidAmountRupees = razorpayPayment.amount / 100;

    const { finalAmount, outstanding } = await getOutstanding(doc, docId);

    const payment = new Payment({
      companyId: String(doc.companyId),
      invoice_id: String(docId),
      f_amount: String(finalAmount),
      amount_text: String(paidAmountRupees),
      payment_date: new Date().toISOString(),
      pymnt_type: paidAmountRupees >= outstanding ? "Final Payment" : "Part Payment",
      payment_mode: "Online (Razorpay)",
      utr_no: razorpay_payment_id,
      ex_no: docType === "invoice" ? doc.invoice_no : doc.est_no,
      added_by: "Exhibitor Portal",
      notes: `Paid online by exhibitor (${req.user.email || req.user.mobile || "unknown"})`,
    });
    await payment.save();

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Exhibitor document verify-payment error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to verify payment" });
  }
};

module.exports = { createOrder, verifyPayment };
