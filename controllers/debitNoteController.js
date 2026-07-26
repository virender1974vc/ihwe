const DebitNote = require("../models/DebitNote");
const { logActivity } = require("../utils/logger");
const { getDocumentAccountName } = require("../utils/accountActivityDetails");

const parseItems = (items) => {
  if (Array.isArray(items)) return items;
  if (!items) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[DebitNote] Failed to parse items:", error.message);
    return [];
  }
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getNextDebitNoteNo = async (req, res) => {
  try {
    const debit_note_no = await DebitNote.generateNextDebitNoteNo();
    res.json({ success: true, debit_note_no });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating debit note number",
      error: error.message,
    });
  }
};

// CREATE DEBIT NOTE
const createDebitNote = async (req, res) => {
  try {
    const debit_note_no = await DebitNote.generateNextDebitNoteNo();

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
      return res.status(400).json({
        success: false,
        message: "At least one debit note item is required",
      });
    }

    const payload = {
      ...req.body,
      debit_note_no,
      items: parsedItems,
      originalAmount: toNumber(req.body.originalAmount),
      taxableAmount: toNumber(req.body.taxableAmount),
      cgstAmount: toNumber(req.body.cgstAmount),
      sgstAmount: toNumber(req.body.sgstAmount),
      igstAmount: toNumber(req.body.igstAmount),
      totalAmount: toNumber(req.body.totalAmount),
    };

    if (req.file) {
      payload.attachmentUrl = `/uploads/debit_notes/${req.file.filename}`;
    }

    const debitNote = new DebitNote(payload);
    await debitNote.save();
    const accountName = await getDocumentAccountName(debitNote, "account");
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Created Debit Note for ${accountName}. Amount: ₹${debitNote.totalAmount || 0}`,
    );

    res.status(201).json({
      success: true,
      message: "Debit Note Created",
      data: debitNote,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Conflict: Debit Note number already exists",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating debit note",
      error: error.message,
    });
  }
};

// GET ALL DEBIT NOTES (optionally filtered by companyId)
const getDebitNotes = async (req, res) => {
  try {
    const filter = req.query.companyId ? { companyId: req.query.companyId } : {};
    const notes = await DebitNote.find(filter).sort({ added: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching debit notes",
      error: error.message,
    });
  }
};

// GET SINGLE DEBIT NOTE
const getDebitNoteById = async (req, res) => {
  try {
    const note = await DebitNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Debit note not found" });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching debit note",
      error: error.message,
    });
  }
};

// UPDATE DEBIT NOTE
const updateDebitNote = async (req, res) => {
  try {
    const updated = await DebitNote.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Debit note not found" });
    }
    const accountName = await getDocumentAccountName(updated, "account");
    await logActivity(
      req,
      "Updated",
      "Accounts",
      `Updated Debit Note for ${accountName}. Amount: ₹${updated.totalAmount || 0}`,
    );
    res.json({ success: true, message: "Debit Note Updated", data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating debit note",
      error: error.message,
    });
  }
};

// DELETE DEBIT NOTE
const deleteDebitNote = async (req, res) => {
  try {
    const deleted = await DebitNote.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Debit note not found" });
    }
    const accountName = await getDocumentAccountName(deleted, "account");
    await logActivity(
      req,
      "Deleted",
      "Accounts",
      `Deleted Debit Note for ${accountName}. Amount: ₹${deleted.totalAmount || 0}`,
    );
    res.json({ success: true, message: "Debit Note Deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting debit note",
      error: error.message,
    });
  }
};

module.exports = {
  createDebitNote,
  getNextDebitNoteNo,
  getDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
};
