const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const AccountDebitNote = require("../models/AccountDebitNote");
const DeliveryChallan = require("../models/DeliveryChallan");
const Payment = require("../models/Payment");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ActivityLog = require("../models/activity/activityLogModel");
const Stall = require("../models/Stall");
const mongoose = require("mongoose");
const { cleanText, formatDetails } = require("../utils/activityLogFormatter");
const { legacyCreditNoteAmount, getCreditedByInvoiceId } = require("../services/ledgerTotals");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const uniqueStrings = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
const isGenericUserName = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || ["admin", "system", "unknown_user", "unknown", "n/a"].includes(normalized);
};
const cleanActorName = (value) => {
  const cleaned = cleanText(value, "");
  return isGenericUserName(cleaned) ? "" : cleaned;
};
const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";
const getProformaCommunicationStatus = (estimate) => {
  if (isCancelledDoc(estimate)) return "Cancelled";
  const emailSent = Boolean(estimate?.emailSent || estimate?.emailSentAt);
  const whatsappSent = Boolean(estimate?.whatsappSent || estimate?.whatsappSentAt);
  if (emailSent && whatsappSent) return "E/W-Sent";
  if (emailSent) return "E-Sent";
  if (whatsappSent) return "W-Sent";
  return "Sent";
};

const resolveCompanyAndExhibitor = async (companyId) => {
  let company = null;
  let exhibitor = null;

  if (isValidId(companyId)) {
    [company, exhibitor] = await Promise.all([
      Company.findById(companyId).lean(),
      ExhibitorRegistration.findById(companyId).lean(),
    ]);
  }

  if (company && !exhibitor && isValidId(company.exhibitorRegistrationId)) {
    exhibitor = await ExhibitorRegistration.findById(company.exhibitorRegistrationId).lean();
  }

  if (exhibitor && !company && isValidId(exhibitor.clientId)) {
    company = await Company.findById(exhibitor.clientId).lean();
  }

  return { company, exhibitor };
};

const buildAccountActivityQuery = (terms) => {
  const uniqueTerms = uniqueStrings(terms);
  if (uniqueTerms.length === 0) return null;

  return {
    module: /^Accounts$/i,
    $or: uniqueTerms.flatMap((term) => {
      const pattern = new RegExp(escapeRegex(term), "i");
      return [
        { details: pattern },
        { link: pattern },
      ];
    }),
  };
};

const EXHIBITOR_STATUS_LABELS = {
  paid: { label: "Active Exhibitor", color: "green" },
  confirmed: { label: "Active Exhibitor", color: "green" },
  "advance-paid": { label: "Advance Paid", color: "blue" },
  pending: { label: "Pending Approval", color: "amber" },
  approved: { label: "Approved", color: "blue" },
  rejected: { label: "Rejected", color: "red" },
  "payment-failed": { label: "Payment Failed", color: "red" },
};

const buildAccountOverview = async (companyId, company, exhibitor) => {
    const lookupIds = Array.from(
      new Set(
        [companyId, company?._id?.toString(), exhibitor?._id?.toString()].filter(Boolean)
      )
    );
    const [invoices, proformaInvoices, creditNotes, debitNotes, accountDebitNotes, deliveryChallans] = await Promise.all([
      Invoice.find({ companyId: { $in: lookupIds } }).lean(),
      Estimate.find({ companyId: { $in: lookupIds } }).lean(),
      CreditNote.find({ companyId: { $in: lookupIds } }).lean(),
      DebitNote.find({ companyId: { $in: lookupIds } }).lean(),
      AccountDebitNote.find({ companyId: { $in: lookupIds }, status: "active" }).lean(),
      DeliveryChallan.find({
        $or: [
          { companyId: { $in: lookupIds } },
          { account_ref_id: { $in: lookupIds } },
        ],
      }).lean(),
    ]);

    // Same balance math as the Client Ledger and the Debit Note allocation screen:
    // CreditNote + the legacy "DebitNote" model (which actually behaves as a second
    // credit-note mechanism — see backend/services/ledgerTotals.js) reduce what's owed;
    // AccountDebitNote (real debit notes: additional charges/late fees/etc.) increase it.
    // Every place in the app that shows "amount due" for an exhibitor now nets the same
    // four collections the same way, instead of each screen computing its own total.
    const creditNoteTotal =
      creditNotes.filter((cn) => !isCancelledDoc(cn)).reduce((sum, cn) => sum + legacyCreditNoteAmount(cn), 0) +
      debitNotes.filter((dn) => !isCancelledDoc(dn)).reduce((sum, dn) => sum + (parseFloat(dn.totalAmount) || 0), 0);
    const debitNoteTotal = accountDebitNotes.reduce((sum, dn) => sum + (parseFloat(dn.totalAmount) || 0), 0);

    const primaryContact = company?.contacts?.find((c) => c.isPrimary) || company?.contacts?.[0];

    const activeInvoices = invoices.filter((invoice) => !isCancelledDoc(invoice));
    const activeProformaInvoices = proformaInvoices.filter((estimate) => !isCancelledDoc(estimate));
    const allDocIds = [
      ...invoices.map((i) => i._id.toString()),
      ...proformaInvoices.map((e) => e._id.toString()),
    ];
    const payableDocIds = new Set([
      ...activeInvoices.map((i) => i._id.toString()),
      ...activeProformaInvoices.map((e) => e._id.toString()),
    ]);

    const allPayments = allDocIds.length
      ? await Payment.find({ invoice_id: { $in: allDocIds } }).lean()
      : [];
    const payments = allPayments.filter((payment) => payableDocIds.has(String(payment.invoice_id)));
    let totalDue = 0;
    let dueBreakdown = [];

    if (activeInvoices.length > 0) {
      totalDue = activeInvoices.reduce((acc, curr) => acc + (parseFloat(curr.finalAmount) || 0), 0);
      dueBreakdown = activeInvoices.map(i => ({ id: i._id, no: i.invoice_no, amount: parseFloat(i.finalAmount) || 0, type: 'Invoice', date: i.invoice_date || i.added }));
    } else if (activeProformaInvoices.length > 0) {
      totalDue = activeProformaInvoices.reduce((acc, curr) => acc + (parseFloat(curr.finalAmount) || 0), 0);
      dueBreakdown = activeProformaInvoices.map(i => ({ id: i._id, no: i.est_no, amount: parseFloat(i.finalAmount) || 0, type: 'Proforma Invoice', date: i.supply_date || i.added }));
    } else if (exhibitor?.financeBreakdown?.netPayable) {
      totalDue = parseFloat(exhibitor.financeBreakdown.netPayable) || 0;
      dueBreakdown = [{ no: 'Registration (Net Payable)', amount: totalDue, type: 'Registration', date: exhibitor?.createdAt }];
    } else if (exhibitor?.totalPayable) {
      totalDue = parseFloat(exhibitor.totalPayable) || 0;
      dueBreakdown = [{ no: 'Registration (Total Payable)', amount: totalDue, type: 'Registration', date: exhibitor?.createdAt }];
    }

    // Real debit notes (additional charges/late fees/etc.) increase what's due, the same
    // way they increase the running balance on the Client Ledger.
    if (debitNoteTotal > 0) {
      totalDue += debitNoteTotal;
      accountDebitNotes.forEach((dn) => dueBreakdown.push({
        id: dn._id,
        no: dn.debit_note_no,
        amount: parseFloat(dn.totalAmount) || 0,
        type: 'Debit Note',
        date: dn.debit_note_date || dn.added,
      }));
    }

    // Amount each invoice has already been credited by CreditNote/legacy-DebitNote,
    // so payment-status and remaining-balance math below never double counts an
    // invoice that's already been adjusted by a credit note.
    const creditedByInvoiceId = getCreditedByInvoiceId(activeInvoices, creditNotes, debitNotes);

    let paidAmount = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount_text) || 0), 0);
    let paidBreakdown = [];
    if (payments.length > 0) {
      paidBreakdown = payments.map(p => {
        let forDoc = invoices.find(i => i._id.toString() === p.invoice_id) || proformaInvoices.find(pi => pi._id.toString() === p.invoice_id);
        let forNo = forDoc ? (forDoc.invoice_no || forDoc.est_no) : p.invoice_id;
        let forType = forDoc ? (forDoc.invoice_no ? 'Invoice' : 'Proforma Invoice') : 'Unknown';
        return {
          id: p._id,
          no: p.ex_no || p.payment_no || 'Payment',
          amount: parseFloat(p.amount_text) || 0,
          date: p.payment_date || p.added,
          type: 'Payment',
          forNo,
          forType
        };
      });
    }
    let onlinePaidAmount = 0;
    if (exhibitor?.paymentHistory && exhibitor.paymentHistory.length > 0) {
      exhibitor.paymentHistory.forEach(ph => {
        const amt = parseFloat(ph.amount) || 0;
        onlinePaidAmount += amt;
        paidBreakdown.push({
          id: ph._id || ph.transactionId || Math.random().toString(),
          no: ph.transactionId || 'Online Payment',
          amount: amt,
          date: ph.paidAt,
          type: 'Online Payment',
          forNo: 'Registration',
          forType: 'Registration'
        });
      });
      paidAmount += onlinePaidAmount;
    } else if (paidAmount === 0 && exhibitor?.amountPaid) {
      const amt = parseFloat(exhibitor.amountPaid) || 0;
      onlinePaidAmount += amt;
      paidAmount += amt;
      paidBreakdown.push({ no: 'Registration Paid', amount: amt, type: 'Registration', date: exhibitor?.createdAt });
    }

    // 3. Compute Remaining Balance — nets credit notes the same way the Client Ledger does,
    // so a credit note reduces "amount due" here too instead of only appearing in the activity feed.
    let remainingBalance = Math.max(0, totalDue - paidAmount - creditNoteTotal);
    let remainingBreakdown = [];

    if (dueBreakdown.length === 1 && dueBreakdown[0].type === 'Registration') {
      const rem = Math.max(0, dueBreakdown[0].amount - paidAmount - creditNoteTotal);
      if (rem > 0) {
        remainingBreakdown.push({
          ...dueBreakdown[0],
          paidAmount: paidAmount,
          remainingAmount: rem
        });
      }
    } else {
      let unallocatedOnlinePaid = onlinePaidAmount;
      dueBreakdown.forEach(doc => {
        const docPayments = payments.filter((p) => String(p.invoice_id) === String(doc.id));
        let docPaid = docPayments.reduce((acc, curr) => acc + (parseFloat(curr.amount_text) || 0), 0);
        docPaid += creditedByInvoiceId[String(doc.id)] || 0;

        let docRemaining = Math.max(0, doc.amount - docPaid);
        if (docRemaining > 0 && unallocatedOnlinePaid > 0) {
          const allocation = Math.min(docRemaining, unallocatedOnlinePaid);
          docPaid += allocation;
          unallocatedOnlinePaid -= allocation;
          docRemaining -= allocation;
        }

        if (docRemaining > 0) {
          remainingBreakdown.push({
            ...doc,
            paidAmount: docPaid,
            remainingAmount: docRemaining
          });
        }
      });
    }

    if (totalDue === 0 && exhibitor?.balanceAmount) {
      remainingBalance = parseFloat(exhibitor.balanceAmount) || 0;
    }

    // 4. Format Recent Documents
    let recentDocs = [];

    invoices.forEach((inv) => recentDocs.push({
      documentType: "Invoice",
      documentNo: inv.invoice_no,
      date: inv.invoice_date || inv.added,
      amount: inv.finalAmount,
      status: isCancelledDoc(inv) ? "Cancelled" : "Unpaid",
      id: inv._id,
      timestamp: inv.added || new Date(),
      cancelled: isCancelledDoc(inv),
    }));

    proformaInvoices.forEach((pi) => recentDocs.push({
      documentType: "Proforma Invoice",
      documentNo: pi.est_no,
      date: pi.supply_date || pi.added,
      amount: pi.finalAmount,
      status: getProformaCommunicationStatus(pi),
      id: pi._id,
      timestamp: pi.added || new Date(),
      cancelled: isCancelledDoc(pi),
    }));

    creditNotes.forEach((cn) => {
      const cnAmount = (cn.items || []).reduce(
        (sum, it) => sum + ((parseFloat(it.cn_amount) || 0) * (it.quantity || 1)),
        0
      );
      recentDocs.push({
        documentType: "Credit Note",
        documentNo: cn.create_note_no,
        date: cn.created_at || cn.updated_date,
        amount: cnAmount,
        status: "Generated",
        id: cn._id,
        timestamp: cn.created_at || new Date(),
      });
    });

    // Despite its model/field names, this legacy "DebitNote" collection is actually a
    // second credit-note mechanism (reduces balance, see backend/services/ledgerTotals.js)
    // — labelled distinctly here so it isn't confused with a real (AccountDebitNote) debit note.
    debitNotes.forEach((dn) => recentDocs.push({
      documentType: "Credit Note (Legacy)",
      documentNo: dn.debit_note_no,
      date: dn.debit_note_date || dn.added,
      amount: dn.totalAmount,
      status: "Generated",
      id: dn._id,
      timestamp: dn.added || new Date(),
    }));

    accountDebitNotes.forEach((dn) => recentDocs.push({
      documentType: "Debit Note",
      documentNo: dn.debit_note_no,
      date: dn.debit_note_date || dn.added,
      amount: dn.totalAmount,
      status: "Generated",
      id: dn._id,
      timestamp: dn.added || new Date(),
    }));

    deliveryChallans.forEach((challan) => {
      const challanAmount = (challan.items || []).reduce(
        (sum, it) => sum + ((parseFloat(it.finalAmount) || 0) || ((parseFloat(it.taxable) || 0) + (parseFloat(it.gstAmount) || 0))),
        0
      );
      recentDocs.push({
        documentType: "Delivery Challan",
        documentNo: challan.challan_no,
        date: challan.challan_date || challan.added,
        amount: challanAmount,
        status: String(challan.status || "issued").replace(/^\w/, (letter) => letter.toUpperCase()),
        id: challan._id,
        timestamp: challan.added || new Date(),
      });
    });

    allPayments.forEach((pmt) => recentDocs.push({
      documentType: "Payment",
      documentNo: pmt.ex_no || pmt.payment_no || 'Payment',
      date: pmt.payment_date || pmt.added,
      amount: parseFloat(pmt.amount_text) || 0,
      status: "Received",
      id: pmt._id,
      timestamp: pmt.added || new Date(),
    }));

    allPayments.forEach((pmt) => recentDocs.push({
      documentType: "Payment",
      documentNo: pmt.ex_no || pmt.payment_no || 'Payment',
      date: pmt.payment_date || pmt.added,
      amount: parseFloat(pmt.amount_text) || 0,
      status: "Received",
      id: pmt._id,
      timestamp: pmt.added || new Date(),
    }));
    let recentDocsUnallocated = onlinePaidAmount;
    recentDocs = recentDocs.map((doc) => {
      if (doc.documentType === "Invoice" || doc.documentType === "Proforma Invoice") {
        if (doc.cancelled) return doc;
        const docPayments = payments.filter((p) => String(p.invoice_id) === String(doc.id));
        let docPaid = docPayments.reduce((acc, curr) => acc + (parseFloat(curr.amount_text) || 0), 0);
        docPaid += creditedByInvoiceId[String(doc.id)] || 0;

        let docRemaining = Math.max(0, parseFloat(doc.amount) - docPaid);
        if (docRemaining > 0 && recentDocsUnallocated > 0) {
          const allocation = Math.min(docRemaining, recentDocsUnallocated);
          docPaid += allocation;
          recentDocsUnallocated -= allocation;
        }

        if (doc.documentType === "Invoice") {
          if (docPaid >= parseFloat(doc.amount) && parseFloat(doc.amount) > 0) doc.status = "Paid";
          else if (docPaid > 0) doc.status = "Partial";
          else doc.status = "Unpaid";
        }
      }
      return doc;
    });
    recentDocs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // recentDocs = recentDocs.slice(0, 5); // User requested all documents to be shown

    const activityQuery = buildAccountActivityQuery([
      companyId,
      company?._id?.toString(),
      exhibitor?._id?.toString(),
      company?.companyName,
      exhibitor?.exhibitorName,
      exhibitor?.registrationId,
      company?.exhibitorRegistrationId,
      company?.email,
      exhibitor?.companyEmail,
      exhibitor?.contact1?.email,
      exhibitor?.contact1?.mobile,
      primaryContact?.email,
      primaryContact?.mobile,
      ...recentDocs.map((doc) => doc.documentNo),
    ]);

    const activityLogs = activityQuery
      ? await ActivityLog.find(activityQuery)
        .sort({ createdAt: -1 })
        .limit(12)
        .lean()
      : [];

    const actorByDocumentNo = new Map();
    const addDocumentActor = (documentNo, actor) => {
      const cleanActor = cleanActorName(actor);
      if (documentNo && cleanActor && !actorByDocumentNo.has(documentNo)) {
        actorByDocumentNo.set(String(documentNo), cleanActor);
      }
    };
    invoices.forEach((invoice) => addDocumentActor(invoice.invoice_no, invoice.added_by || invoice.updated_by));
    proformaInvoices.forEach((estimate) => addDocumentActor(estimate.est_no, estimate.added_by || estimate.updated_by));
    debitNotes.forEach((debitNote) => addDocumentActor(debitNote.debit_note_no, debitNote.added_by || debitNote.updated_by));
    creditNotes.forEach((creditNote) => addDocumentActor(creditNote.create_note_no, creditNote.added_by || creditNote.updated_by));
    deliveryChallans.forEach((challan) => addDocumentActor(challan.challan_no, challan.added_by || challan.updated_by));

    const paymentActorByDocumentNo = new Map();
    payments
      .slice()
      .sort((a, b) => new Date(b.added || b.updated || 0) - new Date(a.added || a.updated || 0))
      .forEach((payment) => {
        const cleanActor = cleanActorName(payment.added_by || payment.updated_by);
        if (payment.ex_no && cleanActor && !paymentActorByDocumentNo.has(payment.ex_no)) {
          paymentActorByDocumentNo.set(String(payment.ex_no), cleanActor);
        }
      });

    const formatScheduleDate = (date) => {
      if (!date) return "TBD";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "TBD";
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    let paymentSchedule = [];
    if (exhibitor?.installments?.length > 0) {
      paymentSchedule = exhibitor.installments.map((inst, idx) => ({
        id: inst.installmentNumber || idx + 1,
        scheduleType: inst.label || `Installment ${inst.installmentNumber || idx + 1}`,
        dueDate: formatScheduleDate(inst.dueDate),
        dueAmount: inst.dueAmount || 0,
        status: inst.status
          ? inst.status.charAt(0).toUpperCase() + inst.status.slice(1)
          : "Pending",
      }));
    } else if (totalDue > 0) {
      // No installment plan was chosen (exhibitor.installments is intentionally [] for
      // full-payment registrations) — show the real single lump-sum due, not an invented split.
      paymentSchedule = [
        {
          id: 1,
          scheduleType: exhibitor?.paymentPlanLabel || "Full Payment",
          dueDate: formatScheduleDate(exhibitor?.paymentDueDate),
          dueAmount: totalDue,
          status: paidAmount >= totalDue ? "Paid" : "Pending",
        },
      ];
    }
    let lastPayment = null;
    if (payments.length > 0) {
      const sortedPayments = [...payments].sort((a, b) => new Date(b.added) - new Date(a.added));
      lastPayment = sortedPayments[0];
    } else if (exhibitor?.paymentHistory?.length > 0) {
      const sortedHistory = [...exhibitor.paymentHistory].sort(
        (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
      );
      const h = sortedHistory[0];
      lastPayment = {
        payment_no: h.transactionId || h.razorpayPaymentId || "-",
        payment_date: h.paidAt,
        added: h.paidAt,
        amount_text: h.amount,
        payment_mode: h.method || h.paymentMode || "-",
        utr_no: h.transactionId || "-",
      };
    }

    // Resolve stall number/size from the exhibitor's participation block
    let stallNoToDisplay = company?.stallNo || company?.stall_no || "N/A";
    let stallSizeToDisplay = company?.stallSize || company?.stall_size || "N/A";
    if (exhibitor?.participation) {
      if (exhibitor.participation.stallNo) {
        if (isValidId(exhibitor.participation.stallNo)) {
          const stallDoc = await Stall.findById(exhibitor.participation.stallNo).lean();
          stallNoToDisplay = stallDoc ? stallDoc.stallNumber : exhibitor.participation.stallNo;
        } else {
          stallNoToDisplay = exhibitor.participation.stallNo;
        }
      }
      if (exhibitor.participation.stallSize) {
        stallSizeToDisplay = exhibitor.participation.stallSize;
      }
    }

    // Resolve contact person + email/mobile from whichever source has it
    const contactPerson =
      (exhibitor?.contact1 && (exhibitor.contact1.firstName || exhibitor.contact1.lastName)
        ? `${exhibitor.contact1.firstName || ""} ${exhibitor.contact1.lastName || ""}`.trim()
        : null) ||
      (primaryContact && (primaryContact.firstName || primaryContact.name)
        ? primaryContact.name || `${primaryContact.firstName || ""} ${primaryContact.surname || ""}`.trim()
        : null) ||
      "N/A";
    const designation = primaryContact?.designation || exhibitor?.contact1?.designation || "N/A";
    let statusLabel = "Lead";
    let statusColor = "gray";
    if (exhibitor?.status && EXHIBITOR_STATUS_LABELS[exhibitor.status]) {
      statusLabel = EXHIBITOR_STATUS_LABELS[exhibitor.status].label;
      statusColor = EXHIBITOR_STATUS_LABELS[exhibitor.status].color;
    } else if (company?.companyStatus) {
      statusLabel = company.companyStatus;
      statusColor = company.companyStatus.toLowerCase().includes("won") ? "green" : "gray";
    }

    const accountDisplayName = company?.companyName || exhibitor?.exhibitorName || "this account";
    const cleanAccountActivityDetails = (details) => {
      let text = formatDetails(details);
      lookupIds.forEach((lookupId) => {
        text = text.replace(new RegExp(`\\b${escapeRegex(lookupId)}\\b`, "g"), accountDisplayName);
      });
      text = text
        .replace(/\bNGW\/[A-Z]+\/\d{2}-\d{2}\/\d+\b/gi, "")
        .replace(/\bNGW\/\d{2}-\d{2}\/PI\/\d+\b/gi, "")
        .replace(/\b(Added|Updated|Deleted)\s+Payment\s+[a-f0-9]{24}\b/gi, "$1 Payment")
        .replace(/\bagainst\s+\.?/gi, "")
        .replace(/\bfor company\s+/gi, "for ")
        .replace(new RegExp(`for\\s+${escapeRegex(accountDisplayName)}\\s+${escapeRegex(accountDisplayName)}`, "gi"), `for ${accountDisplayName}`)
        .replace(/\.{2,}/g, ".")
        .replace(/\s{2,}/g, " ")
        .trim();
      return cleanText(text);
    };
    const resolveActivityUser = (log) => {
      const details = cleanAccountActivityDetails(log.details);
      const isPaymentLog = /\bpayment\b/i.test(details);
      const actorMap = isPaymentLog ? paymentActorByDocumentNo : actorByDocumentNo;
      for (const [documentNo, actor] of actorMap.entries()) {
        if (details.includes(documentNo)) return actor;
      }
      const existingUser = cleanText(log.user, "");
      return isGenericUserName(existingUser) ? "Admin" : existingUser;
    };

    return {
        companyInfo: {
          id: company?._id || exhibitor?._id,
          name: company?.companyName || exhibitor?.exhibitorName || "Unknown Company",
          email:
            company?.email ||
            exhibitor?.companyEmail ||
            exhibitor?.contact1?.email ||
            primaryContact?.email ||
            "N/A",
          mobile:
            company?.landline ||
            exhibitor?.landlineNo ||
            exhibitor?.contact1?.mobile ||
            primaryContact?.mobile ||
            "N/A",
          contactPerson,
          designation,
          stallNo: stallNoToDisplay,
          stallSize: stallSizeToDisplay,
          category:
            company?.category ||
            company?.exhibitorCategory ||
            exhibitor?.primaryCategory ||
            exhibitor?.typeOfBusiness ||
            "N/A",
          registrationDate: exhibitor?.createdAt || company?.createdAt || new Date(),
          address: [
            exhibitor?.address || company?.address,
            exhibitor?.city || company?.city,
            exhibitor?.state || company?.state,
            (exhibitor?.pincode || company?.pincode) ? `- ${exhibitor?.pincode || company?.pincode}` : "",
          ].filter(Boolean).join(", ") || "N/A",
          logo: company?.companyLogo || null,
          statusLabel,
          statusColor,
        },
        financials: {
          totalDue,
          paidAmount,
          remainingBalance,
          creditNoteTotal,
          debitNoteTotal,
          dueBreakdown,
          paidBreakdown,
          remainingBreakdown,
          invoiceCount: invoices.length,
          activeInvoiceCount: activeInvoices.length,
          proformaInvoiceCount: proformaInvoices.length,
          activeProformaInvoiceCount: activeProformaInvoices.length,
          deliveryChallanCount: deliveryChallans.length,
          creditNoteCount: creditNotes.filter((cn) => !isCancelledDoc(cn)).length + debitNotes.filter((dn) => !isCancelledDoc(dn)).length,
          debitNoteCount: accountDebitNotes.length,
        },
        recentDocuments: recentDocs,
        paymentSchedule,
        lastPayment,
        activityLogs: activityLogs.map((log) => ({
          id: log._id,
          action: cleanText(log.action, "Activity"),
          module: cleanText(log.module, "System"),
          details: cleanAccountActivityDetails(log.details),
          user: resolveActivityUser(log),
          link: log.link,
          ip_address: log.ip_address,
          timestamp: log.createdAt,
        })),
    };
};

const getAccountOverview = async (req, res) => {
  try {
    const { companyId } = req.params;

    const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);

    if (!company && !exhibitor) {
      return res.status(404).json({ message: "Company not found" });
    }

    const data = await buildAccountOverview(companyId, company, exhibitor);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getAccountOverview:", error);
    res.status(500).json({ success: false, message: "Error fetching account overview", error: error.message });
  }
};

module.exports = {
  getAccountOverview,
  buildAccountOverview,
  resolveCompanyAndExhibitor,
};
