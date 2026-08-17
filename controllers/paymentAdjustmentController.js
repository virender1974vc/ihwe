const mongoose = require("mongoose");
const PaymentAdjustment = require("../models/PaymentAdjustment");
const Invoice = require("../models/Invoice");
const PerformaInvoice = require("../models/PerformaInvoice");
const Estimate = require("../models/Estimate");
const CreditNote = require("../models/CreditNote");
const AccountDebitNote = require("../models/AccountDebitNote");
const Company = require("../models/Company");
const ExhibitorRegistration = require("../models/ExhibitorRegistration");

const isValidId = (val) => val && mongoose.Types.ObjectId.isValid(val);
const parseAmount = (value) => {
  const amount = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const TYPE_LABELS = {
  against_invoice: "Against Invoice",
  against_performa_invoice: "Against Performa Invoice",
  against_estimate: "Against Estimate",
  against_credit_note: "Against Credit Note",
  against_debit_note: "Against Debit Note",
  write_off: "Write-off",
};

// One entry per creatable adjustment type — where its reference document lives, which
// field carries its display number, and what "Adjust Against" label it maps to.
// nameField is the field the document itself carries its client's name under (used both
// to build the picker label and, when present, to search by company name); CreditNote has
// none, so its search/label path falls back to resolving companyId -> Company separately.
const REFERENCE_CONFIG = {
  against_invoice: { model: Invoice, numberField: "invoice_no", nameField: "company_name", adjustAgainst: "Invoice", notFoundMsg: "Referenced invoice not found" },
  against_performa_invoice: { model: PerformaInvoice, numberField: "pi_no", nameField: "company_name", adjustAgainst: "Performa Invoice", notFoundMsg: "Referenced performa invoice not found" },
  against_estimate: { model: Estimate, numberField: "est_no", nameField: "company_name", adjustAgainst: "Estimate", notFoundMsg: "Referenced estimate not found" },
  against_credit_note: { model: CreditNote, numberField: "create_note_no", nameField: null, adjustAgainst: "Credit Note", notFoundMsg: "Referenced credit note not found" },
  against_debit_note: { model: AccountDebitNote, numberField: "debit_note_no", nameField: "clientName", adjustAgainst: "Debit Note", notFoundMsg: "Referenced debit note not found" },
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveClientName = async (companyId) => {
  if (!isValidId(companyId)) return "Unknown Client";
  const [company, exhibitor] = await Promise.all([
    Company.findById(companyId).lean(),
    ExhibitorRegistration.findById(companyId).lean(),
  ]);
  return company?.companyName || exhibitor?.exhibitorName || "Unknown Client";
};

const getPaymentAdjustments = async (req, res) => {
  try {
    const adjustments = await PaymentAdjustment.find({ status: "active" })
      .sort({ adjustment_date: -1, added: -1 })
      .lean();

    const rows = adjustments.map((adj) => ({
      id: String(adj._id),
      adjustmentNo: adj.adjustment_no,
      adjustmentDate: adj.adjustment_date,
      adjustmentType: adj.adjustmentType,
      adjustmentTypeLabel: TYPE_LABELS[adj.adjustmentType] || adj.adjustmentType,
      adjustAgainst: adj.adjustAgainst,
      referenceNo: adj.referenceNo,
      referenceId: adj.referenceId,
      companyId: adj.companyId,
      client: adj.clientName || "Unknown Client",
      amount: parseAmount(adj.amount),
      reason: adj.reason,
      adjustedBy: adj.adjustedBy || "Admin",
      addedAt: adj.added,
    }));

    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
    const invoiceRows = rows.filter((r) => r.adjustmentType === "against_invoice");
    const creditNoteRows = rows.filter((r) => r.adjustmentType === "against_credit_note");
    const writeOffRows = rows.filter((r) => r.adjustmentType === "write_off");

    res.status(200).json({
      success: true,
      data: {
        rows,
        stats: {
          totalAmount,
          totalCount: rows.length,
          againstInvoiceAmount: invoiceRows.reduce((s, r) => s + r.amount, 0),
          againstInvoiceCount: invoiceRows.length,
          againstCreditNoteAmount: creditNoteRows.reduce((s, r) => s + r.amount, 0),
          againstCreditNoteCount: creditNoteRows.length,
          writeOffAmount: writeOffRows.reduce((s, r) => s + r.amount, 0),
          writeOffCount: writeOffRows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in getPaymentAdjustments:", error);
    res.status(500).json({ success: false, message: "Error fetching payment adjustments", error: error.message });
  }
};

// Powers the "Adjust Against" searchable picker in the New Adjustment modal — queries only
// the model relevant to the selected type, server-side, instead of shipping every invoice/
// estimate/credit note/debit note to the browser up front.
const searchReference = async (req, res) => {
  try {
    const { type, q } = req.query;
    const config = REFERENCE_CONFIG[type];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid adjustment type" });
    }

    const search = String(q || "").trim();
    let docs;

    if (config.model === CreditNote && search) {
      // Credit notes don't carry a company name of their own — also match against
      // companies whose name matches, then pull in that company's credit notes.
      const regex = new RegExp(escapeRegex(search), "i");
      const matchingCompanies = await Company.find({ companyName: regex }).select("_id").lean();
      const matchingCompanyIds = matchingCompanies.map((c) => String(c._id));
      docs = await CreditNote.find({
        $or: [{ create_note_no: regex }, { companyId: { $in: matchingCompanyIds } }],
      }).sort({ added: -1 }).limit(20).lean();
    } else if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const orConds = [{ [config.numberField]: regex }];
      if (config.nameField) orConds.push({ [config.nameField]: regex });
      docs = await config.model.find({ $or: orConds }).sort({ added: -1 }).limit(20).lean();
    } else {
      // No query yet — hand back the most recent ones so the picker isn't empty on open.
      docs = await config.model.find({}).sort({ added: -1 }).limit(20).lean();
    }

    let companyNameById = {};
    if (!config.nameField) {
      const companyIds = [...new Set(docs.map((d) => d.companyId).filter(Boolean))];
      const companies = companyIds.length ? await Company.find({ _id: { $in: companyIds } }).select("companyName").lean() : [];
      companies.forEach((c) => { companyNameById[String(c._id)] = c.companyName; });
    }

    const results = docs.map((doc) => {
      const companyName = config.nameField ? (doc[config.nameField] || "Unknown Client") : (companyNameById[String(doc.companyId)] || "Unknown Client");
      const number = doc[config.numberField];
      return { value: String(doc._id), label: `${number} — ${companyName}`, companyName };
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error in searchReference:", error);
    res.status(500).json({ success: false, message: "Error searching reference documents", error: error.message });
  }
};

const createPaymentAdjustment = async (req, res) => {
  try {
    const { adjustmentType, referenceId, adjustment_date, amount, reason, adjustedBy } = req.body;

    const config = REFERENCE_CONFIG[adjustmentType];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid adjustment type" });
    }
    if (!referenceId) {
      return res.status(400).json({ success: false, message: "A reference document is required" });
    }
    if (!parseAmount(amount) || parseAmount(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const refDoc = isValidId(referenceId) ? await config.model.findById(referenceId).lean() : null;
    if (!refDoc) return res.status(404).json({ success: false, message: config.notFoundMsg });

    const referenceNo = refDoc[config.numberField];
    const companyId = refDoc.companyId;
    const clientName = refDoc.clientName || await resolveClientName(companyId);
    const adjustment_no = await PaymentAdjustment.generateNextAdjustmentNo(adjustment_date);

    const doc = await PaymentAdjustment.create({
      companyId,
      adjustment_no,
      adjustment_date: adjustment_date || new Date().toISOString().slice(0, 10),
      adjustmentType,
      adjustAgainst: config.adjustAgainst,
      referenceId,
      referenceNo,
      clientName,
      amount: parseAmount(amount),
      reason: String(reason).trim(),
      adjustedBy: adjustedBy || "Admin",
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("Error in createPaymentAdjustment:", error);
    res.status(500).json({ success: false, message: "Error creating payment adjustment", error: error.message });
  }
};

module.exports = { getPaymentAdjustments, createPaymentAdjustment, searchReference };
