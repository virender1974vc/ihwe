const BankList = require("../models/BankList");

// @route  GET /api/banks
const getBanks = async (req, res) => {
  try {
    const banks = await BankList.find();
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

// Add new bank
const createBank = async (req, res) => {
  try {
    const { bankname, bankbranch, accountno, ifsccode, status, added_by } =
      req.body;

    const newBank = new BankList({
      bankname,
      bankbranch,
      accountno,
      ifsccode,
      status,
      added_by,
      added: new Date(),
    });

    const savedBank = await newBank.save();
    res.status(201).json(savedBank);
  } catch (err) {
    res.status(500).json({
      message: "Error creating bank",
      error: err.message,
    });
  }
};

// Update bank
const updateBank = async (req, res) => {
  try {
    const updatedBank = await BankList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
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