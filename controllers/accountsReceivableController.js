const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const AccountDebitNote = require("../models/AccountDebitNote");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const Stall = require("../models/Stall");
const { isCancelledDoc, parseAmount, getCreditedByInvoiceId } = require("../services/ledgerTotals");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);

const formatDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};
const buildAccountLookups = async (companyIds) => {
  const validIds = companyIds.filter(isValidId);
  const [companiesRound1, exhibitorsRound1] = await Promise.all([
    Company.find({ _id: { $in: validIds } }).lean(),
    ExhibitorRegistration.find({ _id: { $in: validIds } }).lean(),
  ]);
  const extraExhibitorIds = companiesRound1.map((c) => c.exhibitorRegistrationId).filter(isValidId);
  const extraCompanyIds = exhibitorsRound1.map((e) => e.clientId).filter(isValidId);

  const [extraExhibitors, extraCompanies] = await Promise.all([
    extraExhibitorIds.length ? ExhibitorRegistration.find({ _id: { $in: extraExhibitorIds } }).lean() : [],
    extraCompanyIds.length ? Company.find({ _id: { $in: extraCompanyIds } }).lean() : [],
  ]);

  const companies = [...companiesRound1, ...extraCompanies];
  const exhibitors = [...exhibitorsRound1, ...extraExhibitors];

  const companyById = {};
  companies.forEach((c) => { companyById[String(c._id)] = c; });
  const exhibitorById = {};
  exhibitors.forEach((e) => { exhibitorById[String(e._id)] = e; });

  companiesRound1.forEach((c) => {
    if (c.exhibitorRegistrationId && !exhibitorById[String(c._id)]) {
      const linked = exhibitors.find((e) => String(e._id) === String(c.exhibitorRegistrationId));
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
  const stalls = rawStallRefs.length ? await Stall.find({ _id: { $in: rawStallRefs } }).lean() : [];
  const stallById = {};
  stalls.forEach((s) => { stallById[String(s._id)] = s; });

  return { companyById, exhibitorById, stallById };
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
const getAccountsReceivable = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ invoice_date: -1, added: -1 }).lean();
    const activeInvoices = invoices.filter((inv) => !isCancelledDoc(inv));
    const invoiceIds = activeInvoices.map((inv) => String(inv._id));
    const companyIds = [...new Set(activeInvoices.map((inv) => inv.companyId).filter(Boolean))];

    const [payments, creditNotes, legacyDebitNotes, accountDebitNotes, lookups] = await Promise.all([
      invoiceIds.length ? Payment.find({ invoice_id: { $in: invoiceIds } }).lean() : [],
      companyIds.length ? CreditNote.find({ companyId: { $in: companyIds } }).lean() : [],
      companyIds.length ? DebitNote.find({ companyId: { $in: companyIds } }).lean() : [],
      companyIds.length ? AccountDebitNote.find({ companyId: { $in: companyIds }, status: "active" }).lean() : [],
      buildAccountLookups(companyIds),
    ]);

    const paymentsByInvoiceId = {};
    payments.forEach((p) => {
      const key = String(p.invoice_id);
      (paymentsByInvoiceId[key] || (paymentsByInvoiceId[key] = [])).push(p);
    });

    const creditedByInvoiceId = getCreditedByInvoiceId(activeInvoices, creditNotes, legacyDebitNotes);

    const debitedByInvoiceId = {};
    accountDebitNotes.forEach((dn) => {
      (dn.allocations || []).forEach((alloc) => {
        const key = String(alloc.invoiceId);
        debitedByInvoiceId[key] = (debitedByInvoiceId[key] || 0) + (parseAmount(alloc.appliedAmount));
      });
    });

    const invoiceCountByCompany = {};
    activeInvoices.forEach((inv) => {
      invoiceCountByCompany[inv.companyId] = (invoiceCountByCompany[inv.companyId] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = activeInvoices.map((inv) => {
      const invId = String(inv._id);
      const invPayments = (paymentsByInvoiceId[invId] || []).slice()
        .sort((a, b) => new Date(a.payment_date || a.added) - new Date(b.payment_date || b.added));

      const invValue = parseAmount(inv.finalAmount);
      const received = invPayments.reduce((sum, p) => sum + parseAmount(p.amount_text), 0);
      const tds = invPayments.reduce((sum, p) => sum + parseAmount(p.tds_text), 0);
      const credited = creditedByInvoiceId[invId] || 0;
      const debited = debitedByInvoiceId[invId] || 0;
      const netReceived = received - tds;

      const totalOwed = invValue + debited;
      const settled = received + credited;
      const outstanding = Math.max(0, totalOwed - settled);
      const receivedPct = totalOwed > 0 ? Math.min(100, Math.round((settled / totalOwed) * 1000) / 10) : 0;

      let paymentType = "Pending";
      if (totalOwed > 0 && settled >= totalOwed) paymentType = "Full Payment";
      else if (settled > 0) paymentType = "Partial Payment";

      const dueDate = formatDateOnly(inv.due_date);
      const isOverdue = outstanding > 0 && dueDate && dueDate < today;

      let status = "Unpaid";
      if (totalOwed > 0 && settled >= totalOwed) status = "Paid";
      else if (isOverdue) status = "Overdue";
      else if (settled > 0) status = "Partially Paid";

      const lastPayment = invPayments[invPayments.length - 1];
      const clientInfo = resolveClientInfo(inv.companyId, lookups);
      const hallMatch = String(clientInfo.stallNo || "").match(/^H(\d+)/i);

      return {
        id: inv._id,
        companyId: inv.companyId,
        client: clientInfo.name,
        stallNo: clientInfo.stallNo,
        hallNo: hallMatch ? hallMatch[1] : "",
        sqMtr: clientInfo.stallSize,
        contact: clientInfo.contactPerson,
        invNo: inv.invoice_no,
        invDate: inv.invoice_date || inv.added,
        poNo: inv.po_no || "",
        addedBy: inv.added_by || "",
        totalInvoicesForClient: invoiceCountByCompany[inv.companyId] || 1,
        paymentType,
        invValue,
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
        dueDate: inv.due_date || null,
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
