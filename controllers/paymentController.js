const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const PerformaInvoice = require("../models/PerformaInvoice");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const Company = require("../models/Company");
const { logActivity } = require("../utils/logger");
const { getAccountNameById, getDocumentAccountName } = require("../utils/accountActivityDetails");
const emailService = require("../utils/emailService");
const whatsappService = require("../utils/whatsappService");
const pdfGenerator = require("../utils/pdfGenerator");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const RECEIPT_DIR = path.join(__dirname, "../uploads/payment_receipts");
if (!fs.existsSync(RECEIPT_DIR)) fs.mkdirSync(RECEIPT_DIR, { recursive: true });

const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseAmount = (value) => {
  const amount = Number(String(value || 0).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const resolvePaymentDocument = async (payment) => {
  const mongoose = require("mongoose");
  if (!payment?.invoice_id || !mongoose.Types.ObjectId.isValid(payment.invoice_id)) return null;
  return (
    await Invoice.findById(payment.invoice_id).lean() ||
    await Estimate.findById(payment.invoice_id).lean() ||
    await PerformaInvoice.findById(payment.invoice_id).lean()
  );
};

const getDocumentNo = (doc, payment) => doc?.invoice_no || doc?.est_no || payment?.invoice_no || payment?.invoice_id || "-";
const getDocumentDate = (doc) => doc?.invoice_date || doc?.supply_date || doc?.added || "";
const getDocumentAmount = (doc, payment) => doc?.finalAmount ?? payment?.f_amount ?? 0;

const getPaymentReference = (payment) => (
  payment.utr_no ||
  payment.cash_receipt_no ||
  payment.cheque_no ||
  payment.card_transaction_no ||
  payment.wallet_transaction_no ||
  payment.ex_no ||
  payment.invoice_id ||
  "-"
);

const buildPaymentDetails = (payment) => {
  const rows = [];
  if (payment.payment_mode) rows.push(["Payment Mode", payment.payment_mode]);
  if (payment.pymnt_type) rows.push(["Payment Type", payment.pymnt_type]);
  if (payment.bankId) rows.push(["Bank", payment.bankId]);
  if (payment.utr_no) rows.push(["UTR / Ref No.", payment.utr_no]);
  if (payment.cash_receipt_no) rows.push(["Cash Receipt No.", payment.cash_receipt_no]);
  if (payment.cheque_no) rows.push(["Cheque No.", payment.cheque_no]);
  if (payment.cheque_bank) rows.push(["Cheque Bank", payment.cheque_bank]);
  if (payment.card_transaction_no) rows.push(["Card Txn No.", payment.card_transaction_no]);
  if (payment.wallet_transaction_no) rows.push(["Wallet Txn No.", payment.wallet_transaction_no]);
  return rows;
};

const getReceiptContact = async (payment) => {
  const companyId = payment.companyId;
  const exhibitor = companyId ? await ExhibitorRegistration.findById(companyId).lean() : null;
  const company = companyId ? await Company.findById(companyId).lean() : null;

  let email = "";
  let mobile = "";
  let name = "Contact";
  let companyName = payment.company_name || "";
  let address = "";
  let city = "";
  let state = "";
  let country = "";
  let pincode = "";
  let gstNo = "";

  if (exhibitor) {
    const contact1 = exhibitor.contact1 || {};
    email = contact1.email || "";
    mobile = contact1.whatsapp || contact1.mobile || "";
    name = contact1.name || `${contact1.firstName || ""} ${contact1.lastName || ""}`.trim() || exhibitor.companyName || "Contact";
    companyName = exhibitor.exhibitorName || exhibitor.companyName || exhibitor.companyFirmName || companyName;
    address = exhibitor.address || "";
    city = exhibitor.city || "";
    state = exhibitor.state || "";
    country = exhibitor.country || "";
    pincode = exhibitor.pincode || "";
    gstNo = exhibitor.gstNo || "";
  } else if (company) {
    const contact = company.contacts && company.contacts.length > 0 ? company.contacts[0] : {};
    email = contact.email || company.email || "";
    mobile = contact.mobile || company.landline || "";
    name = contact.name || contact.firstName || company.companyName || "Contact";
    companyName = company.companyName || companyName;
    address = company.address || company.companyAddress || "";
    city = company.city || "";
    state = company.state || "";
    country = company.country || "";
    pincode = company.pincode || company.pinCode || "";
    gstNo = company.gstNo || company.gstin || "";
  }

  return { email, mobile, name, companyName, address, city, state, country, pincode, gstNo, exhibitor };
};

const generateAccountPaymentReceipt = async (payment) => {
  const docData = await resolvePaymentDocument(payment);
  const contact = await getReceiptContact(payment);
  const receiptNo = `PAY-RCPT-${String(payment._id).slice(-8).toUpperCase()}`;
  const invoiceAmount = parseAmount(getDocumentAmount(docData, payment));
  const receivedAmount = parseAmount(payment.amount_text);
  const tdsAmount = parseAmount(payment.tds_text);
  const relatedPayments = payment.invoice_id
    ? await Payment.find({ invoice_id: payment.invoice_id }).sort({ added: 1 }).lean()
    : [payment];
  const currentIndex = Math.max(0, relatedPayments.findIndex((p) => String(p._id) === String(payment._id)));
  const paymentsUpToCurrent = relatedPayments.slice(0, currentIndex + 1);
  const cumulativeReceived = paymentsUpToCurrent.reduce((sum, p) => sum + parseAmount(p.amount_text), 0);
  const cumulativeTds = paymentsUpToCurrent.reduce((sum, p) => sum + parseAmount(p.tds_text), 0);
  const taxableAmount = invoiceAmount > 0 ? Math.round((invoiceAmount / 1.18) * 100) / 100 : 0;
  const gstAmount = Math.max(0, Math.round((invoiceAmount - taxableAmount) * 100) / 100);
  const netPayable = Math.max(0, invoiceAmount - cumulativeTds);
  const balanceAmount = Math.max(0, invoiceAmount - cumulativeReceived);
  const [firstName, ...lastNameParts] = String(contact.name || "Contact").trim().split(/\s+/);

  const paymentMode = payment.payment_mode || "manual";
  const reference = getPaymentReference(payment);
  const paymentHistory = paymentsUpToCurrent.map((p) => ({
    amount: parseAmount(p.amount_text),
    paymentType: p.pymnt_type || "manual",
    paymentMode: p.payment_mode || "manual",
    method: p.payment_mode || "manual",
    transactionId: getPaymentReference(p),
    paidAt: p.payment_date || p.added,
  }));

  const registrationLike = {
    _id: payment._id,
    customReceiptNo: receiptNo,
    registrationId: getDocumentNo(docData, payment),
    exhibitorName: contact.companyName || contact.name || "Client",
    companyEmail: contact.email,
    address: contact.address,
    city: contact.city,
    state: contact.state,
    country: contact.country || "India",
    pincode: contact.pincode,
    gstNo: contact.gstNo,
    contact1: {
      firstName: firstName || contact.name || "Contact",
      lastName: lastNameParts.join(" "),
      email: contact.email,
      mobile: contact.mobile,
      whatsapp: contact.mobile,
    },
    eventId: { name: "IHWE 2026" },
    participation: {
      currency: "INR",
      stallFor: getDocumentNo(docData, payment),
      stallType: docData?.invoice_no ? "Tax Invoice" : "Proforma Invoice",
      stallScheme: payment.pymnt_type || paymentMode,
      dimension: "Payment Receipt",
      stallSize: 1,
      rate: taxableAmount || invoiceAmount,
      amount: taxableAmount || invoiceAmount,
      gstPercent: invoiceAmount > 0 ? 18 : 0,
      total: invoiceAmount,
    },
    financeBreakdown: {
      grossAmount: taxableAmount || invoiceAmount,
      subtotal: taxableAmount || invoiceAmount,
      gstAmount,
      tdsAmount: cumulativeTds,
      tdsPercent: payment.tds_rate || 0,
      netPayable,
    },
    chosenTdsPercent: payment.tds_rate || 0,
    amountPaid: cumulativeReceived,
    balanceAmount,
    paymentMode: paymentMode.toLowerCase() === "online" ? "online" : "manual",
    paymentId: reference,
    manualPaymentDetails: {
      method: paymentMode,
      transactionId: reference,
      paidAt: payment.payment_date || payment.added,
    },
    paymentHistory,
  };

  if (contact.exhibitor) {
    if (contact.exhibitor.participation) {
      registrationLike.participation = contact.exhibitor.participation;
    }
    if (contact.exhibitor.financeBreakdown) {
      registrationLike.financeBreakdown = contact.exhibitor.financeBreakdown;
    }
    registrationLike.chosenTdsPercent = contact.exhibitor.chosenTdsPercent || registrationLike.chosenTdsPercent;
    // We keep amountPaid and balanceAmount as computed from the payments to reflect the current state
  }

  const pdfResult = await pdfGenerator.generatePaymentSlip(registrationLike, { paymentIndex: paymentHistory.length - 1 });
  const filePath = (pdfResult && typeof pdfResult === "object") ? pdfResult.filePath : pdfResult;

  return { filePath, receiptNo, docData, contact, registrationLike };
};

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
    const invoices = await Invoice.find({ _id: { $in: validInvoiceIds } }, "invoice_no invoice_date supply_date finalAmount added company_name consignee_name").lean();
    const estimates = await Estimate.find({ _id: { $in: validInvoiceIds } }, "est_no supply_date finalAmount added company_name consignee_name").lean();
    const proformas = await PerformaInvoice.find({ _id: { $in: validInvoiceIds } }, "est_no supply_date finalAmount added company_name consignee_name").lean();

    const invoiceMap = {};
    invoices.forEach(i => invoiceMap[i._id.toString()] = i);
    estimates.forEach(e => invoiceMap[e._id.toString()] = e);
    proformas.forEach(p => invoiceMap[p._id.toString()] = p);

    const populatedPayments = payments.map(p => {
      const doc = invoiceMap[p.invoice_id] || null;
      return {
        ...p,
        invoice_no: getDocumentNo(doc, p),
        invoice_date: getDocumentDate(doc),
        invoice_amount: getDocumentAmount(doc, p),
        client_name: p.company_name || doc?.company_name || doc?.consignee_name || "Unknown Client",
        receipt_url: `/api/payments/${p._id}/receipt`,
      };
    });

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

// ✅ SEND RECEIPT
const sendPaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'email' or 'whatsapp'
    const payment = await Payment.findById(id).lean();
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    const { filePath, docData, contact, registrationLike } = await generateAccountPaymentReceipt(payment);
    const { email, mobile, name, companyName } = contact;

    if (!email && !mobile) {
      return res.status(400).json({ success: false, message: "No email or mobile found for Contact Person 1." });
    }

    const receiptData = {
      name,
      amount: payment.amount_text,
      mode: payment.payment_mode,
      date: payment.payment_date,
      reference: getDocumentNo(docData, payment),
      companyName,
      receiptPath: filePath,
    };

    let emailSent = false;
    let whatsappSent = false;

    if (email && (!type || type === 'email')) {
      emailSent = await emailService.sendPaymentReceipt(registrationLike, filePath);
    }
    
    if (mobile && (!type || type === 'whatsapp')) {
      const normalizedMobile = whatsappService.formatPhoneNumber(mobile) || mobile;
      whatsappSent = await whatsappService.sendManualPaymentReceipt(normalizedMobile, receiptData);
    }

    res.status(200).json({
      success: true,
      message: `Receipt sent successfully${type ? ' via ' + type : ''}.`,
      emailSent,
      whatsappSent,
      receiptUrl: `/api/payments/${payment._id}/receipt`,
    });

  } catch (error) {
    console.error("sendPaymentReceipt error:", error);
    res.status(500).json({ success: false, message: "Error sending receipt.", error: error.message });
  }
};

const downloadPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).lean();
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const { filePath, receiptNo } = await generateAccountPaymentReceipt(payment);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${receiptNo}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error("downloadPaymentReceipt error:", error);
    res.status(500).json({ success: false, message: "Error generating receipt.", error: error.message });
  }
};

// ✅ EXPORT
module.exports = {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  sendPaymentReceipt,
  downloadPaymentReceipt,
};
