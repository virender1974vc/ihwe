const BankOption = require("../models/BankOption.js");

// ➤ Get all bank options
const getBankOptions = async (req, res) => {
  try {
    const options = await BankOption.find();
    res
      .status(200)
      .json({ message: "Bank options fetched successfully", data: options });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bank options", error: err.message });
  }
};

// ➤ Get single bank option by ID
const getBankOptionById = async (req, res) => {
  try {
    const option = await BankOption.findById(req.params.id);
    if (!option)
      return res.status(404).json({ message: "Bank option not found" });
    res
      .status(200)
      .json({ message: "Bank option fetched successfully", data: option });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bank option", error: err.message });
  }
};

// ➤ Create a new bank option
const createBankOption = async (req, res) => {
  try {
    const { name, status } = req.body;

    const newOption = new BankOption({
      name,
      status: status || "active",
      added: new Date(),
    });

    const savedOption = await newOption.save();

    res
      .status(201)
      .json({ message: "Bank option created successfully", data: savedOption });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating bank option", error: err.message });
  }
};

// ➤ Update bank option
const updateBankOption = async (req, res) => {
  try {
    const updatedOption = await BankOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updatedOption)
      return res.status(404).json({ message: "Bank option not found" });

    res.status(200).json({
      message: "Bank option updated successfully",
      data: updatedOption,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating bank option", error: err.message });
  }
};

// ➤ Delete bank option
const deleteBankOption = async (req, res) => {
  try {
    const deletedOption = await BankOption.findByIdAndDelete(req.params.id);

    if (!deletedOption)
      return res.status(404).json({ message: "Bank option not found" });

    res.status(200).json({
      message: "Bank option deleted successfully",
      data: deletedOption,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting bank option", error: err.message });
  }
};

module.exports = {
  getBankOptions,
  getBankOptionById,
  createBankOption,
  updateBankOption,
  deleteBankOption,
};
