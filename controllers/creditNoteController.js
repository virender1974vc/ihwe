const CreditNote = require("../models/CreditNote");
const { logActivity } = require("../utils/logger");
const { getAccountNameById } = require("../utils/accountActivityDetails");

const calculateCreditNoteAmount = (items = []) =>
  items.reduce((sum, item) => sum + ((parseFloat(item.cn_amount) || 0) * (parseFloat(item.quantity) || 1)), 0);

// Admin submits preparedBy/reviewedBy as a JSON string when the request is
// multipart/form-data (FormData can't carry nested objects) — parse it back
// into a real {name, designation} object so it doesn't get saved as a literal
// string (which is unreadable by anything expecting note.preparedBy.name).
const parseNamedPerson = (value) => {
  if (value && typeof value === "object") return { name: value.name || "", designation: value.designation || "" };
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return { name: parsed?.name || "", designation: parsed?.designation || "" };
  } catch {
    return undefined;
  }
};

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
    // Parse nested objects if they come as strings from FormData
    if (typeof req.body.items === 'string') req.body.items = JSON.parse(req.body.items);
    if (typeof req.body.adjusted_invoices === 'string') req.body.adjusted_invoices = JSON.parse(req.body.adjusted_invoices);
    if (req.body.preparedBy !== undefined) req.body.preparedBy = parseNamedPerson(req.body.preparedBy);
    if (req.body.reviewedBy !== undefined) req.body.reviewedBy = parseNamedPerson(req.body.reviewedBy);

    const creditNo = await generateCreditNoteNo();

    const creditNote = new CreditNote({
      ...req.body,
      create_note_no: creditNo,
      updated_date: new Date(),
      attachment: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await creditNote.save();
    const accountName = await getAccountNameById(creditNote.companyId, "account");
    await logActivity(
      req,
      "Created",
      "Accounts",
      `Created Credit Note for ${accountName}. Amount: ₹${calculateCreditNoteAmount(creditNote.items)}`,
    );

    res.status(201).json({
      success: true,
      message: "Credit Note Created",
      data: creditNote,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Conflict: Credit Note number already exists",
        error: error.message,
      });
    }
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
    const notes = await CreditNote.find().sort({ created_at: -1 }).lean();
    
    const companyIds = [...new Set(notes.map(n => String(n.companyId)).filter(Boolean))];
    const ExhibitorRegistration = require("../models/ExhibitorRegistration");
    const exhibitors = await ExhibitorRegistration.find({
      $or: [
        { _id: { $in: companyIds } },
        { clientId: { $in: companyIds } }
      ]
    }, "clientId eventId").lean();
    
    const eventMap = {};
    exhibitors.forEach(e => {
      if (e.eventId) {
        eventMap[e._id.toString()] = e.eventId;
        if (e.clientId) eventMap[String(e.clientId)] = e.eventId;
      }
    });

    const populatedNotes = notes.map(n => ({
      ...n,
      eventId: eventMap[String(n.companyId)] || null
    }));

    res.json(populatedNotes);
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
    // Parse nested objects if they come as strings from FormData
    if (typeof req.body.items === 'string') req.body.items = JSON.parse(req.body.items);
    if (typeof req.body.adjusted_invoices === 'string') req.body.adjusted_invoices = JSON.parse(req.body.adjusted_invoices);
    if (req.body.preparedBy !== undefined) req.body.preparedBy = parseNamedPerson(req.body.preparedBy);
    if (req.body.reviewedBy !== undefined) req.body.reviewedBy = parseNamedPerson(req.body.reviewedBy);

    const updateData = {
      ...req.body,
      updated_date: new Date(),
    };
    if (req.file) {
      updateData.attachment = `/uploads/${req.file.filename}`;
    }

    const updated = await CreditNote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' },
    );
    if (!updated) {
      return res.status(404).json({ message: "Credit note not found" });
    }
    const accountName = await getAccountNameById(updated.companyId, "account");
    await logActivity(
      req,
      "Updated",
      "Accounts",
      `Updated Credit Note for ${accountName}. Amount: ₹${calculateCreditNoteAmount(updated.items)}`,
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
    const deleted = await CreditNote.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Credit note not found" });
    }
    const accountName = await getAccountNameById(deleted.companyId, "account");
    await logActivity(
      req,
      "Deleted",
      "Accounts",
      `Deleted Credit Note for ${accountName}. Amount: ₹${calculateCreditNoteAmount(deleted.items)}`,
    );
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
