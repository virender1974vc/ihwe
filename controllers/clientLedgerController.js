const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const { resolveCompanyAndExhibitor, buildAccountOverview } = require("./accountOverviewController");
const pdfGenerator = require("../utils/pdfGenerator");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);
const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";
const parseAmount = (value) => {
  const amount = Number(String(value || 0).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const daysBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

const invoiceReference = (invoice) => {
  const firstItem = (invoice.items || [])[0];
  if (firstItem?.description) return firstItem.description;
  return invoice.type_of_invoice || "Invoice raised";
};

// Builds the full client ledger: chronological transactions with a running balance,
// aging buckets, outstanding breakdown and document summary — all derived from real
// Invoice/Payment/CreditNote/DebitNote records for this one client.
const buildClientLedger = async (companyId, company, exhibitor) => {
  const lookupIds = Array.from(
    new Set([companyId, company?._id?.toString(), exhibitor?._id?.toString()].filter(Boolean)),
  );

  const [invoices, legacyCreditNotes, debitNotes] = await Promise.all([
    Invoice.find({ companyId: { $in: lookupIds } }).lean(),
    CreditNote.find({ companyId: { $in: lookupIds } }).lean(),
    DebitNote.find({ companyId: { $in: lookupIds } }).lean(),
  ]);

  const activeInvoices = invoices.filter((inv) => !isCancelledDoc(inv));
  const invoiceIds = activeInvoices.map((inv) => inv._id.toString());
  const payments = invoiceIds.length
    ? await Payment.find({ invoice_id: { $in: invoiceIds } }).sort({ payment_date: 1, added: 1 }).lean()
    : [];

  const paidByInvoiceId = {};
  payments.forEach((p) => {
    const key = String(p.invoice_id);
    paidByInvoiceId[key] = (paidByInvoiceId[key] || 0) + parseAmount(p.amount_text);
  });

  // Credit notes that are tied to a specific invoice must reduce THAT invoice's
  // remaining balance too, not just the global running total — otherwise per-invoice
  // aging/overdue figures double-count what a credit note already adjusted.
  const creditedByInvoiceId = {};
  debitNotes
    .filter((dn) => String(dn.status || "active").toLowerCase() !== "cancelled" && dn.toInvoiceId)
    .forEach((dn) => {
      const key = String(dn.toInvoiceId);
      creditedByInvoiceId[key] = (creditedByInvoiceId[key] || 0) + parseAmount(dn.totalAmount);
    });
  legacyCreditNotes
    .filter((cn) => String(cn.status || "active").toLowerCase() !== "cancelled" && cn.est_no)
    .forEach((cn) => {
      const matchedInvoice = activeInvoices.find((inv) => inv.estimate_no === cn.est_no);
      if (!matchedInvoice) return;
      const amount = (cn.items || []).reduce((sum, it) => sum + (parseAmount(it.cn_amount) * (it.quantity || 1)), 0);
      const key = String(matchedInvoice._id);
      creditedByInvoiceId[key] = (creditedByInvoiceId[key] || 0) + amount;
    });

  const overview = await buildAccountOverview(companyId, company, exhibitor);

  // ---- Ledger entries ----
  const entries = [];

  activeInvoices.forEach((inv) => {
    const amount = parseAmount(inv.finalAmount);
    const paid = paidByInvoiceId[inv._id.toString()] || 0;
    const credited = creditedByInvoiceId[inv._id.toString()] || 0;
    const settled = paid + credited;
    const status = settled >= amount && amount > 0 ? "Paid" : settled > 0 ? "Partially Paid" : "Open";
    entries.push({
      id: inv._id,
      date: inv.invoice_date || inv.added,
      type: "Invoice",
      documentNo: inv.invoice_no,
      reference: invoiceReference(inv),
      debit: amount,
      credit: 0,
      status,
      dueDate: inv.due_date || null,
      _invoiceAmount: amount,
      _invoiceSettled: settled,
    });
  });

  payments.forEach((pmt) => {
    const inv = activeInvoices.find((i) => i._id.toString() === String(pmt.invoice_id));
    const modeRef = pmt.utr_no || pmt.cheque_no || pmt.cash_receipt_no || pmt.card_transaction_no || pmt.wallet_transaction_no;
    const reference = [
      pmt.pymnt_type || "Payment Received",
      pmt.payment_mode ? `- ${pmt.payment_mode}` : "",
      modeRef ? `(${modeRef})` : "",
    ].filter(Boolean).join(" ");
    entries.push({
      id: pmt._id,
      date: pmt.payment_date || pmt.added,
      type: "Payment",
      documentNo: pmt.receipt_no || pmt.ex_no || "Payment",
      reference: reference || `Payment against ${inv?.invoice_no || "invoice"}`,
      debit: 0,
      credit: parseAmount(pmt.amount_text),
      status: "Received",
    });
  });

  legacyCreditNotes
    .filter((cn) => String(cn.status || "active").toLowerCase() !== "cancelled")
    .forEach((cn) => {
      const amount = (cn.items || []).reduce((sum, it) => sum + (parseAmount(it.cn_amount) * (it.quantity || 1)), 0);
      entries.push({
        id: cn._id,
        date: cn.created_at || cn.updated_date,
        type: "Credit Note",
        documentNo: cn.create_note_no,
        reference: cn.items?.[0]?.cedit_note_remark || `Credit note against ${cn.est_no || "invoice"}`,
        debit: 0,
        credit: amount,
        status: "Adjusted",
      });
    });

  debitNotes
    .filter((dn) => String(dn.status || "active").toLowerCase() !== "cancelled")
    .forEach((dn) => {
      entries.push({
        id: dn._id,
        date: dn.debit_note_date || dn.added,
        type: "Credit Note",
        documentNo: dn.debit_note_no,
        reference: dn.reason || dn.remarks || `Credit note against ${dn.toInvoiceNo || "invoice"}`,
        debit: 0,
        credit: parseAmount(dn.totalAmount),
        status: "Adjusted",
      });
    });

  entries.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  let runningBalance = 0;
  const ledger = entries.map((e) => {
    runningBalance += e.debit - e.credit;
    return {
      id: e.id,
      date: e.date,
      type: e.type,
      documentNo: e.documentNo || "N/A",
      reference: e.reference,
      debit: e.debit,
      credit: e.credit,
      balance: runningBalance,
      status: e.status,
    };
  });

  const openingBalance = 0;
  const closingBalance = runningBalance;

  // ---- Aggregates ----
  const invoiceEntries = entries.filter((e) => e.type === "Invoice");
  const paymentEntries = entries.filter((e) => e.type === "Payment");
  const creditNoteEntries = entries.filter((e) => e.type === "Credit Note");

  const totalInvoiced = invoiceEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalReceived = paymentEntries.reduce((sum, e) => sum + e.credit, 0);
  const totalCreditNotes = creditNoteEntries.reduce((sum, e) => sum + e.credit, 0);
  const totalAdjustments = totalCreditNotes;
  const outstandingAmount = Math.max(0, closingBalance);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const outstandingInvoices = invoiceEntries
    .map((e) => ({ ...e, remaining: Math.max(0, e._invoiceAmount - e._invoiceSettled) }))
    .filter((e) => e.remaining > 0);

  let overdueAmount = 0;
  let dueNext30 = 0;
  let dueNext60 = 0;
  const aging = { "0-30 Days": 0, "31-60 Days": 0, "61-90 Days": 0, "90+ Days": 0 };
  let nextDueDate = null;

  outstandingInvoices.forEach((inv) => {
    const due = formatDateOnly(inv.dueDate) || formatDateOnly(inv.date);
    if (!due) return;
    const overdueDays = daysBetween(today, due);

    if (overdueDays > 0) {
      overdueAmount += inv.remaining;
      if (overdueDays <= 30) aging["0-30 Days"] += inv.remaining;
      else if (overdueDays <= 60) aging["31-60 Days"] += inv.remaining;
      else if (overdueDays <= 90) aging["61-90 Days"] += inv.remaining;
      else aging["90+ Days"] += inv.remaining;
    } else {
      const daysUntilDue = -overdueDays;
      if (daysUntilDue <= 30) dueNext30 += inv.remaining;
      else if (daysUntilDue <= 60) dueNext60 += inv.remaining;
      aging["0-30 Days"] += inv.remaining;
    }

    if (!nextDueDate || due < nextDueDate) nextDueDate = due;
  });

  // Defensive clamp: per-invoice remaining amounts can still overstate the true
  // global outstanding when a credit note references an invoice outside this
  // client's own invoice set (a data anomaly). Scale down proportionally so the
  // UI never shows overdue/aging figures larger than the actual outstanding total.
  const rawOutstandingSum = outstandingInvoices.reduce((sum, inv) => sum + inv.remaining, 0);
  if (rawOutstandingSum > outstandingAmount && rawOutstandingSum > 0) {
    const scale = outstandingAmount / rawOutstandingSum;
    overdueAmount *= scale;
    dueNext30 *= scale;
    dueNext60 *= scale;
    Object.keys(aging).forEach((key) => { aging[key] *= scale; });
  }

  const totalAgingBase = Object.values(aging).reduce((a, b) => a + b, 0) || 1;
  const agingBuckets = Object.entries(aging).map(([label, amount]) => ({
    label,
    amount,
    pct: Number(((amount / totalAgingBase) * 100).toFixed(1)),
  }));

  const totalDue = totalInvoiced;
  const paidTotal = totalReceived + totalAdjustments;
  const percentPaid = totalDue > 0 ? Math.min(100, Math.round((paidTotal / totalDue) * 100)) : 0;
  const currentStatusLabel = totalDue === 0 ? "No Invoices" : percentPaid >= 100 ? "Fully Paid" : percentPaid > 0 ? "Partially Paid" : "Unpaid";

  return {
    companyInfo: {
      ...overview.companyInfo,
      gstNo: exhibitor?.gstNo || company?.gstNumber || "N/A",
      panNo: exhibitor?.panNo || "N/A",
      state: exhibitor?.state || company?.state || "N/A",
    },
    financials: {
      totalInvoiced,
      invoiceCount: invoiceEntries.length,
      totalReceived,
      paymentCount: paymentEntries.length,
      totalAdjustments,
      creditNoteCount: creditNoteEntries.length,
      debitNoteCount: 0,
      debitNoteTotal: 0,
      outstandingAmount,
      overdueAmount,
    },
    documentSummary: {
      invoices: { count: invoiceEntries.length, total: totalInvoiced },
      payments: { count: paymentEntries.length, total: totalReceived },
      creditNotes: { count: creditNoteEntries.length, total: totalCreditNotes },
      debitNotes: { count: 0, total: 0 },
    },
    outstandingBreakdown: {
      currentOutstanding: outstandingAmount,
      overdueOver30: aging["31-60 Days"] + aging["61-90 Days"] + aging["90+ Days"],
      dueNext30,
      dueNext60,
    },
    agingBuckets,
    currentStatus: { label: currentStatusLabel, percentPaid },
    lastPayment: overview.lastPayment,
    nextDueDate,
    openingBalance,
    closingBalance,
    ledger,
  };
};

const getClientLedger = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);

    if (!company && !exhibitor) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const data = await buildClientLedger(companyId, company, exhibitor);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getClientLedger:", error);
    res.status(500).json({ success: false, message: "Error fetching client ledger", error: error.message });
  }
};

const downloadClientStatement = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);

    if (!company && !exhibitor) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const ledger = await buildClientLedger(companyId, company, exhibitor);
    const { filePath } = await pdfGenerator.generateClientStatement(ledger);
    const safeName = String(ledger.companyInfo?.name || "Client").replace(/[^a-z0-9]+/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Statement_${safeName}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Error in downloadClientStatement:", error);
    res.status(500).json({ success: false, message: "Error generating statement", error: error.message });
  }
};

module.exports = { getClientLedger, buildClientLedger, downloadClientStatement };
