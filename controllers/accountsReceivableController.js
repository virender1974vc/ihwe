const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const AccountDebitNote = require("../models/AccountDebitNote");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const Stall = require("../models/Stall");
const Event = require("../models/Event");
const { isCancelledDoc, parseAmount, getCreditedByInvoiceId } = require("../services/ledgerTotals");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);

const formatDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};
const buildAccountLookups = async (companyIds) => {
  const validIds = companyIds.filter(isValidId);
  const [companiesRound1, exhibitorsRound1, exhibitorsByClient] = await Promise.all([
    Company.find({ _id: { $in: validIds } }).lean(),
    ExhibitorRegistration.find({ _id: { $in: validIds } }).lean(),
    ExhibitorRegistration.find({ clientId: { $in: validIds } }).lean(),
  ]);
  const extraExhibitorIds = companiesRound1.map((c) => c.exhibitorRegistrationId).filter(isValidId);
  const extraCompanyIds = exhibitorsRound1.map((e) => e.clientId).filter(isValidId);

  const [extraExhibitors, extraCompanies] = await Promise.all([
    extraExhibitorIds.length ? ExhibitorRegistration.find({ _id: { $in: extraExhibitorIds } }).lean() : [],
    extraCompanyIds.length ? Company.find({ _id: { $in: extraCompanyIds } }).lean() : [],
  ]);

  const companies = [...companiesRound1, ...extraCompanies];
  const exhibitors = [...exhibitorsRound1, ...extraExhibitors, ...exhibitorsByClient];

  const companyById = {};
  companies.forEach((c) => { companyById[String(c._id)] = c; });
  const exhibitorById = {};
  exhibitors.forEach((e) => { exhibitorById[String(e._id)] = e; });

  companiesRound1.forEach((c) => {
    if (c.exhibitorRegistrationId && !exhibitorById[String(c._id)]) {
      const linked = exhibitors.find((e) => String(e._id) === String(c.exhibitorRegistrationId));
      if (linked) exhibitorById[String(c._id)] = linked;
    }
    if (!exhibitorById[String(c._id)]) {
      const linked = exhibitors.find((e) => String(e.clientId) === String(c._id));
      if (linked) exhibitorById[String(c._id)] = linked;
    }
  });
  exhibitorsRound1.forEach((e) => {
    if (e.clientId && !companyById[String(e._id)]) {
      const linked = companies.find((c) => String(c._id) === String(e.clientId));
      if (linked) companyById[String(e._id)] = linked;
    }
  });

  const rawStallRefs = exhibitors.map((e) => e?.participation?.stallNo).filter((v) => v && isValidId(v));
  const eventIds = [...new Set(exhibitors.map((e) => e?.eventId).filter(isValidId).map(String))];
  const [stalls, events] = await Promise.all([
    rawStallRefs.length ? Stall.find({ _id: { $in: rawStallRefs } }).lean() : [],
    eventIds.length ? Event.find({ _id: { $in: eventIds } }).lean() : [],
  ]);
  const stallById = {};
  stalls.forEach((s) => { stallById[String(s._id)] = s; });
  const eventById = {};
  events.forEach((e) => { eventById[String(e._id)] = e; });

  return { companyById, exhibitorById, stallById, eventById };
};

const resolveClientInfo = (companyId, { companyById, exhibitorById, stallById }) => {
  const company = companyById[companyId];
  const exhibitor = exhibitorById[companyId];
  const primaryContact = company?.contacts?.find((c) => c.isPrimary) || company?.contacts?.[0];

  let stallNo = company?.stallNo || company?.stall_no || "N/A";
  let stallSize = company?.stallSize || company?.stall_size || null;
  const rawStallNo = exhibitor?.participation?.stallNo;
  if (rawStallNo) {
    if (isValidId(rawStallNo) && stallById[String(rawStallNo)]) {
      stallNo = stallById[String(rawStallNo)].stallNumber;
      stallSize = stallSize || stallById[String(rawStallNo)].area;
    } else {
      stallNo = rawStallNo;
    }
  }
  if (exhibitor?.participation?.stallSize) stallSize = exhibitor.participation.stallSize;

  const contactPerson =
    (exhibitor?.contact1 && (exhibitor.contact1.firstName || exhibitor.contact1.lastName)
      ? `${exhibitor.contact1.firstName || ""} ${exhibitor.contact1.lastName || ""}`.trim()
      : null) ||
    (primaryContact && (primaryContact.name || primaryContact.firstName)
      ? primaryContact.name || `${primaryContact.firstName || ""} ${primaryContact.surname || ""}`.trim()
      : null) ||
    "N/A";

  return {
    name: company?.companyName || exhibitor?.exhibitorName || "Unknown Client",
    stallNo: stallNo || "N/A",
    stallSize: stallSize ? `${stallSize} Sq. Mtr.` : "N/A",
    contactPerson,
  };
};

const getInstallmentDueInfo = (companyId, { exhibitorById, eventById }, today) => {
  const exhibitor = exhibitorById[companyId];
  if (!exhibitor || parseAmount(exhibitor.balanceAmount) <= 0) return null;

  const event = eventById?.[String(exhibitor.eventId)];
  const planById = {};
  (event?.paymentPlans || []).forEach((plan) => {
    if (plan?.id) planById[String(plan.id)] = plan;
  });
  const resolveInstallmentDueDate = (inst) => {
    const eventPlanDueDate = inst?.planId ? planById[String(inst.planId)]?.dueDate : null;
    return formatDateOnly(eventPlanDueDate || inst?.dueDate);
  };

  const unpaidInstallments = (exhibitor.installments || [])
    .filter((inst) => inst && inst.status !== "paid" && parseAmount(inst.dueAmount) > parseAmount(inst.paidAmount))
    .map((inst) => ({
      ...inst,
      resolvedDueDate: resolveInstallmentDueDate(inst),
      resolvedLabel: planById[String(inst.planId)]?.label || inst.label,
    }))
    .sort((a, b) => new Date(a.resolvedDueDate || 0) - new Date(b.resolvedDueDate || 0));

  const nextInstallment = unpaidInstallments[0] || null;
  const dueDate = formatDateOnly(nextInstallment?.resolvedDueDate || exhibitor.paymentDueDate);
  if (!dueDate) return null;

  return {
    dueDate,
    label: nextInstallment?.resolvedLabel || exhibitor.paymentPlanLabel || "Payment Due",
    dueAmount: parseAmount(nextInstallment?.dueAmount),
    paidAmount: parseAmount(nextInstallment?.paidAmount),
    balanceAmount: parseAmount(exhibitor.balanceAmount),
    isOverdue: dueDate < today,
  };
};

const buildReceivableDocuments = (activeInvoices, activeProformas) => {
  const coveredProformaIds = new Set();
  const coveredProformaNos = new Set();

  activeInvoices.forEach((inv) => {
    if (inv.source_estimate_id) coveredProformaIds.add(String(inv.source_estimate_id));
    if (inv.estimate_no) coveredProformaNos.add(String(inv.estimate_no));
  });

  const invoiceDocs = activeInvoices.map((inv) => ({
    raw: inv,
    id: String(inv._id),
    companyId: inv.companyId,
    docType: "Invoice",
    docNo: inv.invoice_no,
    docDate: inv.invoice_date || inv.added,
    dueDate: inv.due_date || null,
    value: parseAmount(inv.finalAmount),
    poNo: inv.po_no || "",
    addedBy: inv.added_by || "",
  }));

  const proformaDocs = activeProformas
    .filter((est) => !coveredProformaIds.has(String(est._id)) && !coveredProformaNos.has(String(est.est_no)))
    .map((est) => ({
      raw: est,
      id: String(est._id),
      companyId: est.companyId,
      docType: "Proforma Invoice",
      docNo: est.est_no,
      docDate: est.supply_date || est.added,
      dueDate: null,
      value: parseAmount(est.finalAmount),
      poNo: "",
      addedBy: est.added_by || "",
    }));

  return [...invoiceDocs, ...proformaDocs].sort((a, b) => new Date(b.docDate || 0) - new Date(a.docDate || 0));
};

const getCreditedByProformaId = (activeProformas, creditNotes, legacyDebitNotes) => {
  const creditedByProformaId = {};

  creditNotes
    .filter((cn) => !isCancelledDoc(cn) && (cn.est_no || cn.reference_invoice_no))
    .forEach((cn) => {
      const matchNo = cn.reference_invoice_no || cn.est_no;
      const matchedProforma = activeProformas.find((est) => est.est_no === matchNo);
      if (!matchedProforma) return;
      const key = String(matchedProforma._id);
      creditedByProformaId[key] = (creditedByProformaId[key] || 0) +
        (cn.items || []).reduce((sum, it) => sum + parseAmount(it.cn_amount) * (it.quantity || 1), 0);
    });

  legacyDebitNotes
    .filter((dn) => !isCancelledDoc(dn) && dn.toInvoiceId)
    .forEach((dn) => {
      const key = String(dn.toInvoiceId);
      if (!activeProformas.some((est) => String(est._id) === key)) return;
      creditedByProformaId[key] = (creditedByProformaId[key] || 0) + parseAmount(dn.totalAmount);
    });

  return creditedByProformaId;
};

const getAccountsReceivable = async (req, res) => {
  try {
    const [invoices, proformas] = await Promise.all([
      Invoice.find().sort({ invoice_date: -1, added: -1 }).lean(),
      Estimate.find().sort({ supply_date: -1, added: -1 }).lean(),
    ]);
    const activeInvoices = invoices.filter((inv) => !isCancelledDoc(inv));
    const activeProformas = proformas.filter((est) => !isCancelledDoc(est));
    const receivableDocs = buildReceivableDocuments(activeInvoices, activeProformas);
    const docIds = receivableDocs.map((doc) => doc.id);
    const companyIds = [...new Set(receivableDocs.map((doc) => doc.companyId).filter(Boolean))];

    const [payments, creditNotes, legacyDebitNotes, accountDebitNotes, lookups] = await Promise.all([
      docIds.length ? Payment.find({ invoice_id: { $in: docIds } }).lean() : [],
      companyIds.length ? CreditNote.find({ companyId: { $in: companyIds } }).lean() : [],
      companyIds.length ? DebitNote.find({ companyId: { $in: companyIds } }).lean() : [],
      companyIds.length ? AccountDebitNote.find({ companyId: { $in: companyIds }, status: "active" }).lean() : [],
      buildAccountLookups(companyIds),
    ]);

    const paymentsByDocId = {};
    payments.forEach((p) => {
      const key = String(p.invoice_id);
      (paymentsByDocId[key] || (paymentsByDocId[key] = [])).push(p);
    });

    const creditedByInvoiceId = getCreditedByInvoiceId(activeInvoices, creditNotes, legacyDebitNotes);
    const creditedByProformaId = getCreditedByProformaId(activeProformas, creditNotes, legacyDebitNotes);

    const debitedByDocId = {};
    accountDebitNotes.forEach((dn) => {
      (dn.allocations || []).forEach((alloc) => {
        const key = String(alloc.invoiceId);
        debitedByDocId[key] = (debitedByDocId[key] || 0) + (parseAmount(alloc.appliedAmount));
      });
    });

    const docCountByCompany = {};
    receivableDocs.forEach((doc) => {
      docCountByCompany[doc.companyId] = (docCountByCompany[doc.companyId] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = receivableDocs.map((doc) => {
      const docPayments = (paymentsByDocId[doc.id] || []).slice()
        .sort((a, b) => new Date(a.payment_date || a.added) - new Date(b.payment_date || b.added));

      const docValue = doc.value;
      const received = docPayments.reduce((sum, p) => sum + parseAmount(p.amount_text), 0);
      const tds = docPayments.reduce((sum, p) => sum + parseAmount(p.tds_text), 0);
      const credited = doc.docType === "Invoice" ? (creditedByInvoiceId[doc.id] || 0) : (creditedByProformaId[doc.id] || 0);
      const debited = debitedByDocId[doc.id] || 0;
      const netReceived = received - tds;

      const totalOwed = docValue + debited;
      const settled = received + credited;
      const outstanding = Math.max(0, totalOwed - settled);
      const receivedPct = totalOwed > 0 ? Math.min(100, Math.round((settled / totalOwed) * 1000) / 10) : 0;

      let paymentType = "Pending";
      if (totalOwed > 0 && settled >= totalOwed) paymentType = "Full Payment";
      else if (settled > 0) paymentType = "Partial Payment";

      const installmentDue = getInstallmentDueInfo(doc.companyId, lookups, today);
      const dueDate = formatDateOnly(doc.dueDate || (doc.docType === "Proforma Invoice" ? installmentDue?.dueDate : null));
      const invoiceOverdue = outstanding > 0 && dueDate && dueDate < today;
      const installmentOverdue = outstanding > 0 && doc.docType === "Proforma Invoice" && installmentDue?.isOverdue;
      const isOverdue = Boolean(invoiceOverdue || installmentOverdue);
      const dueDayDiff = dueDate ? Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
      const hasInstallmentDue = Boolean(installmentDue?.dueDate);
      const dueType = doc.docType === "Proforma Invoice" && hasInstallmentDue
        ? "Installment"
        : doc.docType === "Proforma Invoice"
          ? "Payment Due"
          : "Invoice Due";

      let status = "Unpaid";
      if (totalOwed > 0 && settled >= totalOwed) status = "Paid";
      else if (isOverdue) status = "Overdue";
      else if (settled > 0) status = "Partially Paid";

      const lastPayment = docPayments[docPayments.length - 1];
      const clientInfo = resolveClientInfo(doc.companyId, lookups);
      const hallMatch = String(clientInfo.stallNo || "").match(/^H(\d+)/i);

      return {
        id: doc.id,
        companyId: doc.companyId,
        docType: doc.docType,
        client: clientInfo.name,
        stallNo: clientInfo.stallNo,
        hallNo: hallMatch ? hallMatch[1] : "",
        sqMtr: clientInfo.stallSize,
        contact: clientInfo.contactPerson,
        invNo: doc.docNo,
        invDate: doc.docDate,
        poNo: doc.poNo,
        addedBy: doc.addedBy,
        totalInvoicesForClient: docCountByCompany[doc.companyId] || 1,
        paymentType,
        invValue: docValue,
        received,
        receivedPct,
        tds,
        credited,
        debited,
        netReceived,
        outstanding,
        paymentMode: lastPayment?.payment_mode || "-",
        bank: lastPayment?.bankId || lastPayment?.cheque_bank || lastPayment?.neft_bank || lastPayment?.card_bank || (lastPayment?.pymnt_type === "Online" ? "Razorpay" : "-"),
        utr: lastPayment?.utr_no || lastPayment?.cheque_no || lastPayment?.card_transaction_no || lastPayment?.wallet_transaction_no || lastPayment?.cash_receipt_no || "-",
        utrDate: lastPayment?.payment_date || null,
        dueDate: doc.dueDate || (doc.docType === "Proforma Invoice" ? installmentDue?.dueDate || null : null),
        invoiceOverdue: Boolean(invoiceOverdue),
        installmentOverdue: Boolean(installmentOverdue),
        hasInstallmentDue,
        dueType,
        dueLabel: doc.docType === "Proforma Invoice" ? (installmentDue?.label || "Payment Due") : "Invoice Due",
        dueDaysDiff: dueDayDiff,
        installmentDueDate: installmentDue?.dueDate || null,
        installmentDueLabel: installmentDue?.label || "",
        installmentBalanceAmount: installmentDue?.balanceAmount || 0,
        isOverdue,
        status,
      };
    });

    const totalInvoiceValue = rows.reduce((s, r) => s + r.invValue, 0);
    const totalReceived = rows.reduce((s, r) => s + r.received, 0);
    const totalTds = rows.reduce((s, r) => s + r.tds, 0);
    const netAmountReceived = totalReceived - totalTds;
    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    const overdueAmount = rows.filter((r) => r.status === "Overdue").reduce((s, r) => s + r.outstanding, 0);
    const pendingAmount = totalOutstanding - overdueAmount;

    const fullyPaidCount = rows.filter((r) => r.status === "Paid").length;
    const partiallyPaidCount = rows.filter((r) => r.status === "Partially Paid").length;
    const overdueCount = rows.filter((r) => r.status === "Overdue").length;
    const unpaidCount = rows.filter((r) => r.status === "Unpaid").length;
    const totalCreditNotes = rows.reduce((s, r) => s + r.credited, 0);
    const totalDebitNotes = rows.reduce((s, r) => s + r.debited, 0);
    const avgInvoiceValue = rows.length ? totalInvoiceValue / rows.length : 0;

    res.status(200).json({
      success: true,
      data: {
        rows,
        stats: {
          totalCollections: totalReceived,
          netAmountReceived,
          pendingAmount,
          overdueAmount,
          tdsDeducted: totalTds,
          totalCreditNotes,
          totalDebitNotes,
          avgInvoiceValue,
          totalInvoices: rows.length,
          fullyPaidCount,
          partiallyPaidCount,
          overdueCount,
          unpaidCount,
          totalClients: companyIds.length,
          totalInvoiceValue,
          totalReceived,
          totalOutstanding,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAccountsReceivable:", error);
    res.status(500).json({ success: false, message: "Error fetching accounts receivable", error: error.message });
  }
};

module.exports = { getAccountsReceivable };
