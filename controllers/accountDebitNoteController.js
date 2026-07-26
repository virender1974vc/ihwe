const mongoose = require("mongoose");
const AccountDebitNote = require("../models/AccountDebitNote");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const DebitNote = require("../models/DebitNote"); // the existing "Credit Note" feature's model
const CreditNote = require("../models/CreditNote"); // the other credit-note model — must be netted too, see below
const Stall = require("../models/Stall");
const { resolveCompanyAndExhibitor, buildAccountOverview } = require("./accountOverviewController");
const { getAccountNameById } = require("../utils/accountActivityDetails");
const { logActivity } = require("../utils/logger");
const { getCreditedByInvoiceId } = require("../services/ledgerTotals");
const { attachSignatorySignatures, attachSignatorySignaturesToMany } = require("../utils/signatorySignatures");

const isValidObjectId = (val) => val && mongoose.Types.ObjectId.isValid(val);

// Same stall resolution accountOverviewController.buildAccountOverview uses: a company's
// stall number is often stored as a Stall document reference (an ObjectId), not a plain
// string, so it has to be looked up in the Stall collection to get the real stall number.
const resolveStallNo = async (companyId) => {
  const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);
  let stallNoToDisplay = company?.stallNo || company?.stall_no || "";
  const rawStallNo = exhibitor?.participation?.stallNo;
  if (rawStallNo) {
    if (isValidObjectId(rawStallNo)) {
      const stallDoc = await Stall.findById(rawStallNo).lean();
      stallNoToDisplay = stallDoc ? stallDoc.stallNumber : rawStallNo;
    } else {
      stallNoToDisplay = rawStallNo;
    }
  }
  return stallNoToDisplay || "";
};

const isCancelledDoc = (doc) => String(doc?.status || "").trim().toLowerCase() === "cancelled";
const parseAmount = (value) => {
  const amount = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parseItems = (items) => {
  if (Array.isArray(items)) return items;
  if (!items) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonField = (value) => {
  if (value && typeof value === "object") return { name: value.name || "", designation: value.designation || "" };
  if (!value) return { name: "", designation: "" };
  try {
    const parsed = JSON.parse(value);
    return { name: parsed?.name || "", designation: parsed?.designation || "" };
  } catch {
    return { name: "", designation: "" };
  }
};

const parseAllocations = (allocations) => {
  if (Array.isArray(allocations)) return allocations;
  if (!allocations) return [];
  try {
    const parsed = JSON.parse(allocations);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const computeInvoiceOutstandingMap = async (invoices) => {
  const invoiceIds = invoices.map((inv) => String(inv._id));
  if (!invoiceIds.length) return { paidByInvoice: {}, creditedByInvoice: {} };

  const companyIds = [...new Set(invoices.map((inv) => inv.companyId).filter(Boolean))];
  const [payments, legacyDebitNotes, creditNotes] = await Promise.all([
    Payment.find({ invoice_id: { $in: invoiceIds } }).lean(),
    DebitNote.find({ toInvoiceId: { $in: invoiceIds }, status: { $ne: "cancelled" } }).lean(),
    companyIds.length ? CreditNote.find({ companyId: { $in: companyIds } }).lean() : Promise.resolve([]),
  ]);
  const paidByInvoice = {};
  payments.forEach((p) => {
    const key = String(p.invoice_id);
    paidByInvoice[key] = (paidByInvoice[key] || 0) + parseAmount(p.amount_text);
  });
  const creditedByInvoice = getCreditedByInvoiceId(invoices, creditNotes, legacyDebitNotes);
  return { paidByInvoice, creditedByInvoice };
};
const getCompanyDebitNoteContext = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { company, exhibitor } = await resolveCompanyAndExhibitor(companyId);
    if (!company && !exhibitor) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const overview = await buildAccountOverview(companyId, company, exhibitor);
    const lookupIds = Array.from(
      new Set([companyId, company?._id?.toString(), exhibitor?._id?.toString()].filter(Boolean)),
    );
    const invoices = await Invoice.find({ companyId: { $in: lookupIds } }).lean();
    const activeInvoices = invoices.filter((inv) => !isCancelledDoc(inv));
    const { paidByInvoice = {}, creditedByInvoice = {} } = await computeInvoiceOutstandingMap(activeInvoices);

    const invoiceList = activeInvoices.map((inv) => {
      const id = inv._id.toString();
      const paid = paidByInvoice[id] || 0;
      const credited = creditedByInvoice[id] || 0;
      const outstanding = Math.max(0, parseAmount(inv.finalAmount) - paid - credited);
      return {
        id,
        invoiceNo: inv.invoice_no,
        invoiceDate: inv.invoice_date || inv.added,
        invoiceAmount: parseAmount(inv.finalAmount),
        outstanding,
        eventName: inv.event_name || "",
        gstNo: inv.company_gst_no || inv.gst_no || exhibitor?.gstNo || company?.gstNumber || "",
        state: inv.state || exhibitor?.state || company?.state || "",
        items: (inv.items || []).map((it) => ({
          description: it.description || "",
          hsn: it.hsn || "",
          qty: it.qty || 1,
          unit: it.unit || "Nos",
          rate: it.rate || 0,
          amount: it.amount || 0,
          gstPct: it.gstPct || "18%",
          gstAmount: it.gstAmount || 0,
          total: it.total || 0,
          area: it.area || "",
          size: it.size || "",
          discountPct: it.discountPct,
        })),
      };
    });

    const totalDue = overview.financials.totalDue;
    const paidAmount = overview.financials.paidAmount;
    const remainingBalance = overview.financials.remainingBalance;
    const percentPaid = totalDue > 0 ? Math.round((paidAmount / totalDue) * 100) : 0;
    const accountStatus = totalDue === 0 ? "No Dues" : percentPaid >= 100 ? "Fully Paid" : percentPaid > 0 ? "Part Paid" : "Unpaid";

    res.status(200).json({
      success: true,
      data: {
        companyInfo: overview.companyInfo,
        totalPayable: totalDue,
        totalReceived: paidAmount,
        outstanding: remainingBalance,
        accountStatus,
        invoices: invoiceList,
      },
    });
  } catch (error) {
    console.error("Error in getCompanyDebitNoteContext:", error);
    res.status(500).json({ success: false, message: "Error fetching debit note context", error: error.message });
  }
};

const getNextDebitNoteNo = async (req, res) => {
  try {
    const debit_note_no = await AccountDebitNote.generateNextDebitNoteNo();
    res.json({ success: true, debit_note_no });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating debit note number", error: error.message });
  }
};

// CREATE — validates items + multi-invoice allocation before saving
const createAccountDebitNote = async (req, res) => {
  try {
    const parsedItems = parseItems(req.body.items)
      .filter((item) => item && item.description)
      .map((item) => ({
        description: item.description,
        hsn: item.hsn || "",
        qty: toNumber(item.qty, 1),
        unit: item.unit || "Nos",
        rate: toNumber(item.rate),
        amount: toNumber(item.amount),
        gstPct: item.gstPct || "18%",
        gstAmount: toNumber(item.gstAmount),
        total: toNumber(item.total),
      }));

    if (parsedItems.length === 0) {
      return res.status(400).json({ success: false, message: "At least one charge item is required" });
    }

    const parsedAllocations = parseAllocations(req.body.allocations)
      .filter((a) => a && a.invoiceId && toNumber(a.appliedAmount) > 0)
      .map((a) => ({
        invoiceId: a.invoiceId,
        invoiceNo: a.invoiceNo || "",
        invoiceDate: a.invoiceDate || "",
        invoiceAmount: toNumber(a.invoiceAmount),
        outstandingBeforeDN: toNumber(a.outstandingBeforeDN),
        appliedAmount: toNumber(a.appliedAmount),
      }));

    if (parsedAllocations.length === 0) {
      return res.status(400).json({ success: false, message: "At least one invoice must be selected for allocation" });
    }

    const totalAmount = toNumber(req.body.totalAmount);
    const totalApplied = parsedAllocations.reduce((sum, a) => sum + a.appliedAmount, 0);
    if (Math.abs(totalApplied - totalAmount) > 1) {
      return res.status(400).json({
        success: false,
        message: `Allocated amount (₹${totalApplied.toFixed(2)}) must equal the debit note value (₹${totalAmount.toFixed(2)})`,
      });
    }

    const debit_note_no = await AccountDebitNote.generateNextDebitNoteNo(req.body.debit_note_date);

    const payload = {
      companyId: req.body.companyId,
      debit_note_no,
      debit_note_date: req.body.debit_note_date,
      debitNoteType: req.body.debitNoteType || "additional_charges",
      reason: req.body.reason,
      reference: req.body.reference || "",
      clientName: req.body.clientName || "",
      proforma_invoice_no: req.body.proforma_invoice_no || "",
      preparedBy: parseJsonField(req.body.preparedBy),
      reviewedBy: parseJsonField(req.body.reviewedBy),
      items: parsedItems,
      taxableAmount: toNumber(req.body.taxableAmount),
      gstAmount: toNumber(req.body.gstAmount),
      totalAmount,
      allocations: parsedAllocations,
      tdsDeduction: toNumber(req.body.tdsDeduction),
      adjustmentCreditNote: toNumber(req.body.adjustmentCreditNote),
      remarks: req.body.remarks,
      status: req.body.status === "draft" ? "draft" : "active",
      added_by: req.body.added_by || "Admin",
    };

    if (req.file) {
      payload.attachmentUrl = `/uploads/account_debit_notes/${req.file.filename}`;
    }

    const debitNote = new AccountDebitNote(payload);
    await debitNote.save();

    const accountName = await getAccountNameById(debitNote.companyId, "account");
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Created Debit Note ${debit_note_no} for ${accountName}. Amount: ₹${debitNote.totalAmount || 0}`,
    );

    res.status(201).json({ success: true, message: "Debit Note Created", data: debitNote });
  } catch (error) {
    console.error("Error in createAccountDebitNote:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Conflict: Debit Note number already exists", error: error.message });
    }
    res.status(500).json({ success: false, message: "Error creating debit note", error: error.message });
  }
};
const enrichWithSettlementStatus = async (notes) => {
  const allInvoiceIds = [...new Set(notes.flatMap((n) => n.allocations.map((a) => a.invoiceId)))];
  const invoices = await Invoice.find({ _id: { $in: allInvoiceIds } }).lean();
  const invoiceById = {};
  invoices.forEach((inv) => { invoiceById[inv._id.toString()] = inv; });
  const { paidByInvoice = {}, creditedByInvoice = {} } = await computeInvoiceOutstandingMap(invoices);

  return notes.map((note) => {
    let settledAmount = 0;
    note.allocations.forEach((alloc) => {
      const inv = invoiceById[alloc.invoiceId];
      if (!inv) return;
      const paid = paidByInvoice[alloc.invoiceId] || 0;
      const credited = creditedByInvoice[alloc.invoiceId] || 0;
      const currentOutstanding = Math.max(0, parseAmount(inv.finalAmount) - paid - credited);
      const recovered = Math.max(0, alloc.outstandingBeforeDN - currentOutstanding);
      settledAmount += Math.min(recovered, alloc.appliedAmount);
    });
    settledAmount = Math.min(settledAmount, note.totalAmount);
    const outstandingAmount = Math.max(0, note.totalAmount - settledAmount);
    const settlementStatus = settledAmount <= 0 ? "Outstanding" : outstandingAmount <= 0 ? "Adjusted" : "Partially Adjusted";
    return { ...note, settledAmount, outstandingAmount, settlementStatus };
  });
};

// GET ALL (optionally filtered by companyId) — enriched with real settlement status
const getAccountDebitNotes = async (req, res) => {
  try {
    let filter = {};
    if (req.query.companyId) {
      const requestedId = req.query.companyId;
      const { company, exhibitor } = await resolveCompanyAndExhibitor(requestedId);
      const linkedIds = [
        requestedId,
        company?._id?.toString(),
        exhibitor?._id?.toString(),
      ].filter(Boolean);
      filter = { companyId: { $in: [...new Set(linkedIds)] } };
    }
    const notes = await AccountDebitNote.find(filter).sort({ added: -1 }).lean();
    const enriched = await enrichWithSettlementStatus(notes);

    const companyIds = [...new Set(notes.map((n) => n.companyId).filter(Boolean))];
    const stallMap = {};
    const eventMap = {};
    const ExhibitorRegistration = require("../models/ExhibitorRegistration");
    const exhibitors = await ExhibitorRegistration.find({
      $or: [
        { _id: { $in: companyIds } },
        { clientId: { $in: companyIds } }
      ]
    }, "clientId eventId").lean();
    exhibitors.forEach(e => {
      if (e.eventId) {
        eventMap[e._id.toString()] = e.eventId;
        if (e.clientId) eventMap[String(e.clientId)] = e.eventId;
      }
    });

    await Promise.all(companyIds.map(async (companyId) => {
      stallMap[companyId] = await resolveStallNo(companyId);
    }));

    const withStall = enriched.map((note) => {
      const stallNo = stallMap[note.companyId] || "";
      const hallMatch = stallNo.match(/^H(\d+)/i);
      const eventId = eventMap[note.companyId] || null;
      return { ...note, stallNo, hallNo: hallMatch ? hallMatch[1] : "", eventId };
    });

    const withSignatures = await attachSignatorySignaturesToMany(withStall);
    res.json({ success: true, data: withSignatures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching debit notes", error: error.message });
  }
};

const getAccountDebitNoteById = async (req, res) => {
  try {
    const note = await AccountDebitNote.findById(req.params.id).lean();
    if (!note) return res.status(404).json({ success: false, message: "Debit note not found" });
    const [enriched] = await enrichWithSettlementStatus([note]);
    const withSignatures = await attachSignatorySignatures(enriched);
    res.json({ success: true, data: withSignatures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching debit note", error: error.message });
  }
};

const updateAccountDebitNote = async (req, res) => {
  try {
    // req.body may arrive as plain JSON (axios JSON post) or, when an attachment is
    // included, as multipart FormData where nested objects/arrays were stringified —
    // parse the same way createAccountDebitNote does so an edit-and-resave doesn't
    // silently corrupt items/allocations/preparedBy/reviewedBy.
    const update = { ...req.body };
    if (update.items !== undefined) update.items = parseItems(update.items);
    if (update.allocations !== undefined) update.allocations = parseAllocations(update.allocations);
    if (update.preparedBy !== undefined) update.preparedBy = parseJsonField(update.preparedBy);
    if (update.reviewedBy !== undefined) update.reviewedBy = parseJsonField(update.reviewedBy);
    if (req.file) update.attachmentUrl = `/uploads/account_debit_notes/${req.file.filename}`;

    const updated = await AccountDebitNote.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ success: false, message: "Debit note not found" });
    const accountName = await getAccountNameById(updated.companyId, "account");
    await logActivity(req, "Updated", "Accounts", `Updated Debit Note ${updated.debit_note_no} for ${accountName}.`);
    res.json({ success: true, message: "Debit Note Updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating debit note", error: error.message });
  }
};

const deleteAccountDebitNote = async (req, res) => {
  try {
    const deleted = await AccountDebitNote.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Debit note not found" });
    const accountName = await getAccountNameById(deleted.companyId, "account");
    await logActivity(req, "Deleted", "Accounts", `Deleted Debit Note ${deleted.debit_note_no} for ${accountName}.`);
    res.json({ success: true, message: "Debit Note Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting debit note", error: error.message });
  }
};

module.exports = {
  getCompanyDebitNoteContext,
  getNextDebitNoteNo,
  createAccountDebitNote,
  getAccountDebitNotes,
  getAccountDebitNoteById,
  updateAccountDebitNote,
  deleteAccountDebitNote,
};
