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
const CrmEvent = require("../models/CrmEvent");
const CrmUser = require("../models/CrmUser");
const { isCancelledDoc, parseAmount, getCreditedByInvoiceId } = require("../services/ledgerTotals");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);

const formatDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const resolveDateDaysBeforeEvent = (event, daysBeforeEvent) => {
  const eventStart = formatDateOnly(event?.startDate);
  const days = Number(daysBeforeEvent);
  if (!eventStart || !Number.isFinite(days)) return null;
  const dueDate = new Date(eventStart);
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() - days);
  return dueDate;
};

const resolvePlanDueDate = (event, plan) => (
  resolveDateDaysBeforeEvent(event, plan?.dueDaysBeforeEvent) ||
  formatDateOnly(plan?.dueDate)
);

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const toTitleCase = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, " ")
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeSearchText = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

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

  const assigneeValues = companies.flatMap((company) => [
    company.forwardTo,
    ...(company.eventAssignments || []).map((assignment) => assignment.forwardTo),
  ]).filter(Boolean);
  const hasAssignees = assigneeValues.some((value) => normalizeKey(value));
  const crmUsers = hasAssignees
    ? await CrmUser.find({}).select("user_name user_fullname").lean()
    : [];
  const userNameByKey = {};
  crmUsers.forEach((user) => {
    const fullName = user.user_fullname || user.user_name;
    if (user.user_name) userNameByKey[normalizeKey(user.user_name)] = fullName;
    if (user.user_fullname) userNameByKey[normalizeKey(user.user_fullname)] = fullName;
  });

  return { companyById, exhibitorById, stallById, eventById, userNameByKey };
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
    eventId: exhibitor?.eventId || company?.eventId || null,
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
    const eventPlanDueDate = inst?.planId ? resolvePlanDueDate(event, planById[String(inst.planId)]) : null;
    return eventPlanDueDate || formatDateOnly(inst?.dueDate);
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
    planId: nextInstallment?.planId || null,
    dueAmount: parseAmount(nextInstallment?.dueAmount),
    paidAmount: parseAmount(nextInstallment?.paidAmount),
    balanceAmount: parseAmount(exhibitor.balanceAmount),
    isOverdue: dueDate < today,
  };
};

// Exhibitor is on an installment schedule only when its `installments` array was actually
// populated (Full Payment bookings leave it empty) — used to tell "PYMT Req." apart from
// "Advance/Running/Final PYMT Req.".
const getPymtTypeLabel = (exhibitor) => {
  const installments = exhibitor?.installments;
  if (!Array.isArray(installments) || installments.length === 0) return "PYMT Req.";

  const nextUnpaid = installments
    .filter((inst) => inst && inst.status !== "paid" && parseAmount(inst.dueAmount) > parseAmount(inst.paidAmount))
    .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))[0];

  switch (nextUnpaid?.planId) {
    case "advance": return "Advance PYMT Req.";
    case "running": return "Running PYMT Req.";
    case "final":
    case "final_balance": return "Final PYMT Req.";
    default: return "PYMT Req.";
  }
};

// Fallback for PIs paid manually through Accounts (no ExhibitorRegistration.installments
// tracking): derive the next-due phase from the PI's own chosen paymentPlanType and how much
// of the total has actually been settled, against the event's advance/running percentages.
const getPymtTypeFromPlanProgress = (planType, event, settled, totalOwed) => {
  const plans = event?.paymentPlans || [];
  if (!planType || planType === "full" || !plans.length || totalOwed <= 0) return "PYMT Req.";

  const planEntry = plans.find((p) => p.id === planType);
  if (planEntry && Number(planEntry.percentage) === 100) return "PYMT Req.";

  const advancePct = Number(plans.find((p) => p.id === "advance")?.percentage) || 0;
  const runningPct = Number(plans.find((p) => p.id === "running")?.percentage) || 0;
  if (!advancePct && !runningPct) return "PYMT Req.";

  const paidPct = (settled / totalOwed) * 100;
  const EPS = 0.5; // tolerate rounding noise around a threshold
  if (paidPct < advancePct - EPS) return "Advance PYMT Req.";
  if (paidPct < advancePct + runningPct - EPS) return "Running PYMT Req.";
  return "Final PYMT Req.";
};

const buildReceivableDocuments = (activeInvoices, activeProformas, includeConvertedProformas = false) => {
  const coveredProformaIds = new Set();
  const coveredProformaNos = new Set();
  const convertedInfoByProformaId = {};
  const convertedInfoByProformaNo = {};

  activeInvoices.forEach((inv) => {
    const info = { invoiceNo: inv.invoice_no, invoiceId: String(inv._id) };
    if (inv.source_estimate_id) {
      coveredProformaIds.add(String(inv.source_estimate_id));
      convertedInfoByProformaId[String(inv.source_estimate_id)] = info;
    }
    if (inv.estimate_no) {
      coveredProformaNos.add(String(inv.estimate_no));
      convertedInfoByProformaNo[String(inv.estimate_no)] = info;
    }
  });

  // Invoice has no paymentPlanType of its own — inherit it from the estimate it was raised from.
  const estimateById = {};
  const estimateByNo = {};
  activeProformas.forEach((est) => {
    estimateById[String(est._id)] = est;
    if (est.est_no) estimateByNo[String(est.est_no)] = est;
  });

  const invoiceDocs = activeInvoices.map((inv) => {
    const sourceEstimate = (inv.source_estimate_id && estimateById[String(inv.source_estimate_id)])
      || (inv.estimate_no && estimateByNo[String(inv.estimate_no)])
      || null;
    return {
      raw: inv,
      id: String(inv._id),
      companyId: inv.companyId,
      crmEventId: inv.crmEventId ? String(inv.crmEventId) : "",
      docType: "Invoice",
      docNo: inv.invoice_no,
      proformaNo: inv.estimate_no || "",
      docDate: inv.invoice_date || inv.added,
      dueDate: inv.due_date || null,
      value: parseAmount(inv.finalAmount),
      poNo: inv.po_no || "",
      addedBy: inv.added_by || "",
      paymentPlanType: sourceEstimate?.paymentPlanType || "",
    };
  });

  const proformaDocs = activeProformas
    .filter((est) => includeConvertedProformas
      || (!coveredProformaIds.has(String(est._id)) && !coveredProformaNos.has(String(est.est_no))))
    .map((est) => ({
      raw: est,
      id: String(est._id),
      companyId: est.companyId,
      crmEventId: est.crmEventId ? String(est.crmEventId) : "",
      docType: "Proforma Invoice",
      docNo: est.est_no,
      proformaNo: est.est_no,
      docDate: est.supply_date || est.added,
      dueDate: null,
      value: parseAmount(est.finalAmount),
      poNo: "",
      addedBy: est.added_by || "",
      paymentPlanType: est.paymentPlanType || "",
      convertedInfo: convertedInfoByProformaId[String(est._id)] || convertedInfoByProformaNo[String(est.est_no)] || null,
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
    // includeAllProformas: the dedicated Proforma Invoices page wants to see every PI it has
    // ever raised — converted-to-invoice and cancelled ones included — not just the "still
    // live" subset the shared Payments/Invoices pages care about.
    const includeAllProformas = req.query.includeAllProformas === "true";
    const activeProformas = includeAllProformas ? proformas : proformas.filter((est) => !isCancelledDoc(est));
    const receivableDocs = buildReceivableDocuments(activeInvoices, activeProformas, includeAllProformas);
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

    // Resolve each PI/invoice's own event (via the CrmEvent it was raised against) so its
    // paymentPlanType can be checked against that event's actual advance/running percentages —
    // this is the same event the "Payment Plan" dropdown on the PI itself was populated from,
    // which can differ from whichever event the exhibitor's registration links to.
    const crmEventIds = [...new Set(receivableDocs.map((doc) => doc.crmEventId).filter(isValidId))];
    const crmEvents = crmEventIds.length
      ? await CrmEvent.find({ _id: { $in: crmEventIds } }).select("registrationEventId").lean()
      : [];
    const registrationEventIdByCrmEventId = {};
    crmEvents.forEach((ce) => {
      if (ce.registrationEventId) registrationEventIdByCrmEventId[String(ce._id)] = String(ce.registrationEventId);
    });
    const extraEventIds = [...new Set(Object.values(registrationEventIdByCrmEventId))]
      .filter((eid) => !lookups.eventById[eid]);
    const extraEvents = extraEventIds.length ? await Event.find({ _id: { $in: extraEventIds } }).lean() : [];
    extraEvents.forEach((e) => { lookups.eventById[String(e._id)] = e; });

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

    const allRows = receivableDocs.map((doc) => {
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
      const exhibitor = lookups.exhibitorById[doc.companyId];
      const event = exhibitor ? lookups.eventById[String(exhibitor.eventId)] : null;
      const defaultPlan = event?.paymentPlans?.find(p => p.isDefault);
      const eventGeneralDueDate = resolvePlanDueDate(event, defaultPlan);

      // Prefer the precise per-installment tracking on the exhibitor's registration; when that's
      // empty (PI paid manually via Accounts, never went through online checkout) fall back to
      // the PI's own paymentPlanType plus how much of it has been settled so far.
      let pymtType = getPymtTypeLabel(exhibitor);
      if (pymtType === "PYMT Req." && doc.paymentPlanType) {
        const docEvent = lookups.eventById[registrationEventIdByCrmEventId[doc.crmEventId]] || event;
        pymtType = getPymtTypeFromPlanProgress(doc.paymentPlanType, docEvent, settled, totalOwed);
      }

      const fallbackInvoiceDueDate = (() => {
        if (doc.docType !== "Invoice") return null;
        if (eventGeneralDueDate) return eventGeneralDueDate;
        const docDate = formatDateOnly(doc.docDate);
        if (!docDate) return null;
        const fallback = new Date(docDate);
        fallback.setDate(fallback.getDate() + 30);
        return fallback;
      })();

      const dueDate = formatDateOnly(doc.dueDate) || fallbackInvoiceDueDate || (doc.docType === "Proforma Invoice" ? (formatDateOnly(installmentDue?.dueDate) || eventGeneralDueDate) : null);
      const invoiceOverdue = outstanding > 0 && dueDate && dueDate < today;
      const installmentOverdue = outstanding > 0 && doc.docType === "Proforma Invoice" && installmentDue?.isOverdue;
      const isOverdue = Boolean(invoiceOverdue || installmentOverdue);
      const dueDayDiff = dueDate ? Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
      const hasInstallmentDue = Boolean(installmentDue?.dueDate);
      
      const dueType = doc.docType === "Proforma Invoice" && hasInstallmentDue
        ? "Installment"
        : (!formatDateOnly(doc.dueDate) && !hasInstallmentDue && eventGeneralDueDate && dueDate === eventGeneralDueDate)
          ? "General Event Due"
          : doc.docType === "Proforma Invoice"
            ? "Payment Due"
            : "Invoice Due";

      const overdueDays = isOverdue && dueDate
        ? Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
        : 0;
      const status = isOverdue ? "Overdue" : "Unpaid";

      const lastPayment = docPayments[docPayments.length - 1];
      const clientInfo = resolveClientInfo(doc.companyId, lookups);
      const company = lookups.companyById[doc.companyId];
      const rawHandledBy = (company?.eventAssignments || []).find(
        (assignment) => String(assignment.eventId) === String(doc.crmEventId || ""),
      )?.forwardTo || company?.forwardTo || doc.addedBy || "";
      const handledBy = lookups.userNameByKey[normalizeKey(rawHandledBy)] || toTitleCase(rawHandledBy);
      const hallMatch = String(clientInfo.stallNo || "").match(/^H(\d+)/i);
      const hasBookedStand = Boolean(
        exhibitor?.participation?.stallNo &&
        Number(exhibitor?.participation?.stallSize || 0) > 0 &&
        Number(exhibitor?.participation?.total || 0) > 0
      );

      return {
        id: doc.id,
        companyId: doc.companyId,
        docType: doc.docType,
        client: clientInfo.name,
        proformaNo: doc.proformaNo || (doc.docType === "Proforma Invoice" ? doc.docNo : ""),
        invoiceNo: doc.docType === "Invoice" ? doc.docNo : "",
        stallNo: clientInfo.stallNo,
        hallNo: hallMatch ? hallMatch[1] : "",
        sqMtr: clientInfo.stallSize,
        contact: clientInfo.contactPerson,
        invNo: doc.docNo,
        invDate: doc.docDate,
        poNo: doc.poNo,
        addedBy: doc.addedBy,
        handledBy,
        totalInvoicesForClient: docCountByCompany[doc.companyId] || 1,
        paymentType,
        pymtType,
        // The actual type recorded on the most recent Payment against this
        // document (e.g. "Advance Payment"/"Running Payment"/"Full Payment"),
        // as opposed to pymtType above which is a derived installment-progress
        // label, not what was literally selected when that payment was logged.
        lastPymtType: lastPayment?.pymnt_type || null,
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
        dueDate: dueDate || null,
        invoiceOverdue: Boolean(invoiceOverdue),
        installmentOverdue: Boolean(installmentOverdue),
        hasInstallmentDue,
        dueType,
        dueLabel: dueType === "General Event Due" ? "General Event Due" : doc.docType === "Proforma Invoice" ? (installmentDue?.label || "Payment Due") : "Invoice Due",
        dueDaysDiff: dueDayDiff,
        installmentDueDate: installmentDue?.dueDate || null,
        installmentDueLabel: installmentDue?.label || "",
        installmentBalanceAmount: installmentDue?.balanceAmount || 0,
        hasBookedStand,
        isOverdue,
        overdueDays,
        status,
        eventId: event ? String(event._id) : null,
        crmEventId: doc.crmEventId || null,
        convertedInvoiceNo: doc.convertedInfo?.invoiceNo || null,
        convertedInvoiceId: doc.convertedInfo?.invoiceId || null,
      };
    });

    const clientCompanySearch = normalizeSearchText(req.query.clientCompanySearch);
    const docTypeFilter = req.query.docType;
    const rows = allRows
      .filter((row) => !docTypeFilter || row.docType === docTypeFilter)
      .filter((row) => !clientCompanySearch || normalizeSearchText(row.client).includes(clientCompanySearch));
    const filteredCompanyIds = [...new Set(rows.map((row) => row.companyId).filter(Boolean))];

    const totalInvoiceValue = rows.reduce((s, r) => s + r.invValue, 0);
    const totalReceived = rows.reduce((s, r) => s + r.received, 0);
    const totalTds = rows.reduce((s, r) => s + r.tds, 0);
    const netAmountReceived = totalReceived - totalTds;
    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    const overdueAmount = rows.filter((r) => r.status === "Overdue").reduce((s, r) => s + r.outstanding, 0);
    const pendingAmount = totalOutstanding - overdueAmount;

    // r.status only ever carries a due-date reading ("Unpaid"/"Overdue"), never a payment-progress
    // one — so "fully/partially paid" must come from paymentType, the amount-progress field.
    const fullyPaidCount = rows.filter((r) => r.paymentType === "Full Payment").length;
    const partiallyPaidCount = rows.filter((r) => r.paymentType === "Partial Payment").length;
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
          totalClients: filteredCompanyIds.length,
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
