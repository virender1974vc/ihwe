const CreditNote = require("../models/CreditNote");

// Fiscal Year Function
const getFiscalYear = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const startYear = month >= 4 ? year : year - 1;
  const endYear = month >= 4 ? year + 1 : year;

  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

// Generate Credit Note Number
const generateCreditNoteNo = async () => {
  const fiscalYear = getFiscalYear();
  const prefix = `NGW/CRD/${fiscalYear}/`;

  const lastNote = await CreditNote.findOne({
    create_note_no: { $regex: new RegExp(`^${prefix}`) },
  }).sort({ created_at: -1 });

  let nextNumber = 1;

  if (lastNote) {
    const parts = lastNote.create_note_no.split("/");
    const lastNumber = parseInt(parts[parts.length - 1]);

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(3, "0");

  return `${prefix}${paddedNumber}`;
};

// CREATE CREDIT NOTE
const createCreditNote = async (req, res) => {
  try {
    const creditNo = await generateCreditNoteNo();

    const creditNote = new CreditNote({
      ...req.body,
      create_note_no: creditNo,
      updated_date: new Date(),
    });

    await creditNote.save();

    res.status(201).json({
      success: true,
      message: "Credit Note Created",
      data: creditNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating credit note",
      error: error.message,
    });
  }
};

// GET ALL CREDIT NOTES
const getCreditNotes = async (req, res) => {
  try {
    const notes = await CreditNote.find().sort({ created_at: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching credit notes",
      error: error.message,
    });
  }
};

// GET SINGLE CREDIT NOTE
const getCreditNoteById = async (req, res) => {
  try {
    const note = await CreditNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Credit note not found" });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching credit note",
      error: error.message,
    });
  }
};

// UPDATE CREDIT NOTE
const updateCreditNote = async (req, res) => {
  try {
    const updated = await CreditNote.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updated_date: new Date(),
      },
      { new: true },
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Error updating credit note",
      error: error.message,
    });
  }
};

// DELETE CREDIT NOTE
const deleteCreditNote = async (req, res) => {
  try {
    await CreditNote.findByIdAndDelete(req.params.id);
    res.json({ message: "Credit Note Deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting credit note",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
};
