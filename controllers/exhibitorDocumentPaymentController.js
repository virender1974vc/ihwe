const mongoose = require("mongoose");
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const DeliveryChallan = require("../models/DeliveryChallan");
const Payment = require("../models/Payment");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const Company = require("../models/Company");
const CreditNote = require("../models/CreditNote");
const AccountDebitNote = require("../models/AccountDebitNote");
const DebitNote = require("../models/DebitNote");

const DOC_MODELS = { invoice: Invoice, proforma: Estimate };
const VIEW_DOC_MODELS = {
  invoice: Invoice,
  proforma: Estimate,
  challan: DeliveryChallan,
  creditnote: CreditNote,
  debitnote: AccountDebitNote,
  // The legacy "DebitNote" model actually behaves as a second credit-note mechanism
  // (see accountOverviewController) — labelled "Credit Note (Legacy)" in the dashboard.
  legacycreditnote: DebitNote,
};

// The legacy DebitNote schema uses different field names than the real CreditNote
// schema. Normalize it into the same shape CreditNotePrintTemplate already knows how
// to render, instead of building/maintaining a second print template.
const mapLegacyDebitNoteToCreditNoteShape = (doc) => ({
  ...doc,
  create_note_no: doc.debit_note_no,
  credit_note_date: doc.debit_note_date,
  reference_invoice_no: doc.toInvoiceNo,
  credit_note_type: doc.type,
  reason: doc.reason,
  remarks: doc.remarks,
  clientName: doc.clientName,
  taxableAmount: doc.taxableAmount,
  gstAmount: (doc.cgstAmount || 0) + (doc.sgstAmount || 0) + (doc.igstAmount || 0),
  totalAmount: doc.totalAmount,
  items: (doc.items || []).map((it) => ({
    item: it.description,
    hsn: it.hsn,
    quantity: it.qty,
    unit: it.unit,
    rate: it.rate,
    taxableValue: it.amount,
    gstPct: it.gstPct,
    gstAmount: it.gstAmount,
    total: it.total,
  })),
});
const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";
const toNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const getEstimateItemFinancials = (item = {}) => {
  const qty = toNumber(item.qty);
  const rate = toNumber(item.rate);
  const amount = toNumber(item.amount) || rate * qty;
  const discountPercent = toNumber(item.disc ?? item.discountPct);
  const discount = toNumber(item.discountAmount ?? item.discount) || (amount * discountPercent) / 100;
  const taxable = toNumber(item.tax ?? item.taxable ?? item.taxableValue) || Math.max(0, amount - discount);
  const gstRate = toNumber(item.gstRate ?? item.gst_per ?? item.gstPct)
    || toNumber(item.igst_per)
    || toNumber(item.cgst_per) * 2;
  const gstAmount = toNumber(item.gstAmount)
    || (gstRate ? (taxable * gstRate) / 100 : toNumber(item.igst) + toNumber(item.cgst) + toNumber(item.sgst));
  return { rate, amount, discount, taxable, gstRate, gstAmount, finalAmount: taxable + gstAmount };
};

const enrichChallanFromEstimate = async (challan) => {
  if (!challan?.source_estimate_id) return challan;
  const estimate = await Estimate.findById(challan.source_estimate_id).lean();
  if (!estimate) return challan;

  const estimateById = new Map(
    (estimate.items || []).filter((item) => item._id).map((item) => [`item:${String(item._id)}`, item])
  );

  return {
    ...challan,
    items: (challan.items || []).map((item, index) => {
      const source = estimateById.get(String(item.sourceItemKey)) || estimate.items?.[index];
      if (!source) return item;

      const sourceFinancials = getEstimateItemFinancials(source);
      const sourceQty = toNumber(item.sourceQty) || toNumber(source.qty);
      return {
        ...item,
        sourceQty,
        rate: toNumber(item.rate) || sourceFinancials.rate,
        amount: toNumber(item.amount) || sourceFinancials.amount,
        discount: toNumber(item.discount) || sourceFinancials.discount,
        taxable: toNumber(item.taxable) || sourceFinancials.taxable,
        gstRate: toNumber(item.gstRate) || sourceFinancials.gstRate,
        gstAmount: toNumber(item.gstAmount) || sourceFinancials.gstAmount,
        finalAmount: toNumber(item.finalAmount) || sourceFinancials.finalAmount,
      };
    }),
  };
};

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

const lookupCompanyOrExhibitor = async (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  const company = await Company.findById(id).lean();
  if (company) return { ...company, _source: "company" };

  const exhibitor = await ExhibitorRegistration.findById(id).lean();
  if (exhibitor) return { ...exhibitor, _source: "exhibitorRegistration" };

  return null;
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

    let doc = await Model.findById(docId).lean();
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

const getDocument = async (req, res) => {
  try {
    if (req.user.role !== "exhibitor") {
      return res.status(403).json({ success: false, message: "Access denied. Exhibitors only." });
    }

    const { docType, docId } = req.params;
    const Model = VIEW_DOC_MODELS[docType];
    if (!Model || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ success: false, message: "Invalid document reference" });
    }

    let doc = await Model.findById(docId).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const authorizedIds = await getAuthorizedCompanyIds(req.user);
    const isOwned = authorizedIds.has(String(doc.companyId)) || authorizedIds.has(String(doc.account_ref_id));
    if (!isOwned) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (docType === "legacycreditnote") {
      doc = mapLegacyDebitNoteToCreditNoteShape(doc);
    }

    if (docType === "challan") {
      doc = await enrichChallanFromEstimate(doc);
    }

    // The invoice's own embedded delivery_challans snapshot only carries
    // description/hsn/qty/unit per item (no pricing) — enrich it from the real
    // DeliveryChallan documents so the print view can show Rate/Discount/Amount/GST.
    // delivery_challan_id isn't always a trustworthy link (older/seeded invoices may
    // have a stale one), so we also fall back to the challan's unique challan_no.
    if (docType === "invoice" && Array.isArray(doc.delivery_challans) && doc.delivery_challans.length > 0) {
      const challanIds = doc.delivery_challans
        .map((c) => c.delivery_challan_id)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
      const challanNos = doc.delivery_challans.map((c) => c.challan_no).filter(Boolean);

      const orClauses = [];
      if (challanIds.length) orClauses.push({ _id: { $in: challanIds } });
      if (challanNos.length) orClauses.push({ challan_no: { $in: challanNos } });

      const fullChallans = orClauses.length
        ? await DeliveryChallan.find({ $or: orClauses }).lean()
        : [];
      const byId = new Map(fullChallans.map((c) => [String(c._id), c]));
      const byNo = new Map(fullChallans.map((c) => [String(c.challan_no), c]));

      doc.delivery_challans = doc.delivery_challans.map((embedded) => {
        const full = byId.get(String(embedded.delivery_challan_id)) || byNo.get(String(embedded.challan_no));
        if (!full) return embedded;

        const fullItemsByKey = new Map(
          (full.items || []).map((it) => [`${it.description}|${it.hsn}|${it.qty}`, it])
        );

        return {
          ...embedded,
          items: (embedded.items || []).map((item, idx) => {
            const fullItem = fullItemsByKey.get(`${item.description}|${item.hsn}|${item.qty}`) || full.items?.[idx];
            return fullItem ? {
              ...item,
              rate: fullItem.rate,
              discount: fullItem.discount,
              taxable: fullItem.taxable,
              gstRate: fullItem.gstRate,
              gstAmount: fullItem.gstAmount,
              finalAmount: fullItem.finalAmount,
            } : item;
          }),
        };
      });
    }

    const company = await lookupCompanyOrExhibitor(doc.companyId || doc.account_ref_id);

    res.json({ success: true, document: doc, company });
  } catch (error) {
    console.error("Exhibitor get-document error:", error);
    res.status(500).json({ success: false, message: error?.message || "Failed to load document" });
  }
};

module.exports = { createOrder, verifyPayment, getDocument };
