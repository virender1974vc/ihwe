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

// Real (not stored/cached) per-invoice outstanding: finalAmount minus payments minus
// any credit notes already applied to that invoice — nets BOTH credit-note models
// (CreditNote and the legacy "DebitNote", which despite its name behaves as a second
// credit-note mechanism) via the same shared logic the Client Ledger uses, so this
// screen's "outstanding" always agrees with the Client Ledger's.
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

// GET /api/account-debit-notes/company/:companyId/context
// Powers the Create Debit Note form: exhibitor summary bar + the list of invoices
// (with real computed outstanding) available to allocate the debit note against.
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
    res.status(500).json({ success: false, message: "Error creating debit note", error: error.message });
  }
};

// Computes, for a set of debit notes, how much of each has actually been recovered —
// by comparing each allocation's invoice outstanding AT CREATION TIME to its outstanding
// NOW. If the invoice's outstanding has dropped since, that recovery is attributed
// (capped at the allocated amount) to this debit note. This is a real computation, not
// a stored/guessable flag — there's no direct Payment-to-DebitNote link in this system.
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
    const filter = req.query.companyId ? { companyId: req.query.companyId } : {};
    const notes = await AccountDebitNote.find(filter).sort({ added: -1 }).lean();
    const enriched = await enrichWithSettlementStatus(notes);

    const companyIds = [...new Set(notes.map((n) => n.companyId).filter(Boolean))];
    const stallMap = {};
    await Promise.all(companyIds.map(async (companyId) => {
      stallMap[companyId] = await resolveStallNo(companyId);
    }));

    const withStall = enriched.map((note) => {
      const stallNo = stallMap[note.companyId] || "";
      const hallMatch = stallNo.match(/^H(\d+)/i);
      return { ...note, stallNo, hallNo: hallMatch ? hallMatch[1] : "" };
    });

    res.json({ success: true, data: withStall });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching debit notes", error: error.message });
  }
};

const getAccountDebitNoteById = async (req, res) => {
  try {
    const note = await AccountDebitNote.findById(req.params.id).lean();
    if (!note) return res.status(404).json({ success: false, message: "Debit note not found" });
    const [enriched] = await enrichWithSettlementStatus([note]);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching debit note", error: error.message });
  }
};

const updateAccountDebitNote = async (req, res) => {
  try {
    const updated = await AccountDebitNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
