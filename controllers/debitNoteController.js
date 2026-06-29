const DebitNote = require("../models/DebitNote");

// CREATE DEBIT NOTE
const createDebitNote = async (req, res) => {
  try {
    const debit_note_no = await DebitNote.generateNextDebitNoteNo();

    const payload = { ...req.body, debit_note_no };
    if (req.file) {
      payload.attachmentUrl = `/uploads/debit_notes/${req.file.filename}`;
    }

    const debitNote = new DebitNote(payload);
    await debitNote.save();

    res.status(201).json({
      success: true,
      message: "Debit Note Created",
      data: debitNote,
    });
  } catch (error) {
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
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Debit note not found" });
    }
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
  getDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
};
