const BankList = require("../models/BankList");

// @route  GET /api/banks
const getBanks = async (req, res) => {
  try {
    const banks = await BankList.find().sort({ isPrimary: -1, added: -1 });
    res.json(banks);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching bank list",
      error: err.message,
    });
  }
};

// @route  GET /api/banks/:id
const getBankById = async (req, res) => {
  try {
    const bank = await BankList.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: "Bank not found" });

    res.json(bank);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching bank",
      error: err.message,
    });
  }
};

const BOOLEAN_FIELDS = [
  "upiEnabled",
  "isPrimary",
  "showOnProformaInvoice",
  "showOnTaxInvoice",
  "showOnPaymentReceipt",
  "allowShareWithClient",
];

// multipart/form-data sends every field as a string, so booleans need coercion
const normalizeBody = (body) => {
  const normalized = { ...body };
  BOOLEAN_FIELDS.forEach((field) => {
    if (normalized[field] !== undefined) {
      normalized[field] = normalized[field] === true || normalized[field] === "true";
    }
  });
  return normalized;
};

// Add new bank
const createBank = async (req, res) => {
  try {
    const data = normalizeBody(req.body);

    if (req.file) {
      data.qrCodeUrl = `/uploads/bank_qr/${req.file.filename}`;
    }

    if (data.isPrimary) {
      await BankList.updateMany({}, { $set: { isPrimary: false } });
    }

    const newBank = new BankList(data);
    const savedBank = await newBank.save();
    res.status(201).json(savedBank);
  } catch (err) {
    console.error("Error creating bank:", err);
    res.status(500).json({
      message: "Error creating bank",
      error: err.message,
    });
  }
};

// Update bank
const updateBank = async (req, res) => {
  try {
    const data = normalizeBody(req.body);

    if (req.file) {
      data.qrCodeUrl = `/uploads/bank_qr/${req.file.filename}`;
    }

    if (data.isPrimary) {
      await BankList.updateMany(
        { _id: { $ne: req.params.id } },
        { $set: { isPrimary: false } },
      );
    }

    const updatedBank = await BankList.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true },
    );

    if (!updatedBank)
      return res.status(404).json({ message: "Bank not found" });

    res.status(200).json({
      message: "Bank updated successfully",
      data: updatedBank,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating bank",
      error: err.message,
    });
  }
};

// Delete bank
const deleteBank = async (req, res) => {
  try {
    const deletedBank = await BankList.findByIdAndDelete(req.params.id);

    if (!deletedBank)
      return res.status(404).json({ message: "Bank not found" });

    res.json({ message: "Bank deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting bank",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
};
