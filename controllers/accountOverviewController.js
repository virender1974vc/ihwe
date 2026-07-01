const Invoice = require("../models/Invoice");
const Estimate = require("../models/Estimate");
const CreditNote = require("../models/CreditNote");
const DebitNote = require("../models/DebitNote");
const Payment = require("../models/Payment");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");
const ActivityLog = require("../models/activity/activityLogModel");
const Stall = require("../models/Stall");
const mongoose = require("mongoose");
const { cleanText, formatDetails } = require("../utils/activityLogFormatter");

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

const getAccountOverview = async (req, res) => {
  try {
    const { companyId } = req.params;

    const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);

    if (!company && !exhibitor) {
      return res.status(404).json({ message: "Company not found" });
    }
    const lookupIds = Array.from(
      new Set(
        [companyId, company?._id?.toString(), exhibitor?._id?.toString()].filter(Boolean)
      )
    );
    const [invoices, proformaInvoices, creditNotes, debitNotes] = await Promise.all([
      Invoice.find({ companyId: { $in: lookupIds } }).lean(),
      Estimate.find({ companyId: { $in: lookupIds } }).lean(),
      CreditNote.find({ companyId: { $in: lookupIds } }).lean(),
      DebitNote.find({ companyId: { $in: lookupIds } }).lean(),
    ]);

    const primaryContact = company?.contacts?.find((c) => c.isPrimary) || company?.contacts?.[0];

    const docIds = [
      ...invoices.map((i) => i._id.toString()),
      ...proformaInvoices.map((e) => e._id.toString()),
    ];

    const payments = docIds.length
      ? await Payment.find({ invoice_id: { $in: docIds } }).lean()
      : [];
    let totalDue = 0;
    let dueBreakdown = [];
    if (invoices.length > 0) {
      totalDue = invoices.reduce((acc, curr) => acc + (parseFloat(curr.finalAmount) || 0), 0);
      dueBreakdown = invoices.map(i => ({ id: i._id, no: i.invoice_no, amount: parseFloat(i.finalAmount) || 0, type: 'Invoice', date: i.invoice_date || i.added }));
    } else if (exhibitor?.financeBreakdown?.netPayable) {
      totalDue = parseFloat(exhibitor.financeBreakdown.netPayable) || 0;
      dueBreakdown = [{ no: 'Registration (Net Payable)', amount: totalDue, type: 'Registration', date: exhibitor?.createdAt }];
    } else if (exhibitor?.totalPayable) {
      totalDue = parseFloat(exhibitor.totalPayable) || 0;
      dueBreakdown = [{ no: 'Registration (Total Payable)', amount: totalDue, type: 'Registration', date: exhibitor?.createdAt }];
    } else if (proformaInvoices.length > 0) {
      totalDue = proformaInvoices.reduce((acc, curr) => acc + (parseFloat(curr.finalAmount) || 0), 0);
      dueBreakdown = proformaInvoices.map(i => ({ id: i._id, no: i.est_no, amount: parseFloat(i.finalAmount) || 0, type: 'Proforma Invoice', date: i.supply_date || i.added }));
    }

    // 2. Compute Paid Amount
    // NOTE: on the Payment model, f_amount is the document's TOTAL amount and
    // amount_text is the amount actually RECEIVED in that payment (see PaymentTable.jsx
    // where Balance = f_amount - amount_text). Paid amount must sum amount_text.
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
    } else if (paidAmount === 0 && exhibitor?.amountPaid) {
      paidAmount = parseFloat(exhibitor.amountPaid) || 0;
      paidBreakdown = [{ no: 'Registration Paid', amount: paidAmount, type: 'Registration', date: exhibitor?.createdAt }];
    }

    // 3. Compute Remaining Balance
    let remainingBalance = Math.max(0, totalDue - paidAmount);
    let remainingBreakdown = [];

    if (dueBreakdown.length === 1 && dueBreakdown[0].type === 'Registration') {
        const rem = Math.max(0, dueBreakdown[0].amount - paidAmount);
        if (rem > 0) {
            remainingBreakdown.push({
                ...dueBreakdown[0],
                paidAmount: paidAmount,
                remainingAmount: rem
            });
        }
    } else {
        dueBreakdown.forEach(doc => {
           const docPayments = payments.filter((p) => p.invoice_id === doc.id?.toString());
           const docPaid = docPayments.reduce((acc, curr) => acc + (parseFloat(curr.amount_text) || 0), 0);
           const rem = Math.max(0, doc.amount - docPaid);
           if (rem > 0) {
               remainingBreakdown.push({
                   ...doc,
                   paidAmount: docPaid,
                   remainingAmount: rem
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
      status: "Unpaid",
      id: inv._id,
      timestamp: inv.added || new Date(),
    }));

    proformaInvoices.forEach((pi) => recentDocs.push({
      documentType: "Proforma Invoice",
      documentNo: pi.est_no,
      date: pi.supply_date || pi.added,
      amount: pi.finalAmount,
      status: "Sent",
      id: pi._id,
      timestamp: pi.added || new Date(),
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

    debitNotes.forEach((dn) => recentDocs.push({
      documentType: "Debit Note",
      documentNo: dn.debit_note_no,
      date: dn.debit_note_date || dn.added,
      amount: dn.totalAmount,
      status: "Generated",
      id: dn._id,
      timestamp: dn.added || new Date(),
    }));
    recentDocs = recentDocs.map((doc) => {
      if (doc.documentType === "Invoice" || doc.documentType === "Proforma Invoice") {
        const docPayments = payments.filter((p) => p.invoice_id === doc.id.toString());
        const docPaid = docPayments.reduce((acc, curr) => acc + (parseFloat(curr.amount_text) || 0), 0);
        if (docPaid >= parseFloat(doc.amount) && parseFloat(doc.amount) > 0) doc.status = "Paid";
        else if (docPaid > 0) doc.status = "Partial";
        else doc.status = doc.documentType === "Invoice" ? "Unpaid" : "Sent";
      }
      return doc;
    });
    recentDocs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentDocs = recentDocs.slice(0, 5);

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

    res.status(200).json({
      success: true,
      data: {
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
          dueBreakdown,
          paidBreakdown,
          remainingBreakdown,
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
      },
    });
  } catch (error) {
    console.error("Error in getAccountOverview:", error);
    res.status(500).json({ success: false, message: "Error fetching account overview", error: error.message });
  }
};

module.exports = {
  getAccountOverview,
};
