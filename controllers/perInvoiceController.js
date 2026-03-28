const PerformaInvoice = require("../models/PerformaInvoice");

// ✅ Create new Performa Invoice
const createPerformaInvoice = async (req, res) => {
  try {
    const { est_no, companyId, finalAmount } = req.body;

    if (!est_no || !companyId || !finalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pi_no = await PerformaInvoice.generateNextPINumber();

    const invoice = new PerformaInvoice({
      est_no,
      companyId,
      pi_no,
      finalAmount,
      added: new Date(),
    });

    await invoice.save();

    res.status(201).json({
      message: "✅ Performa Invoice Created",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating Performa Invoice",
      error: error.message,
    });
  }
};

// ✅ Get all Performa Invoices
const getAllPerformaInvoices = async (req, res) => {
  try {
    const invoices = await PerformaInvoice.find().sort({ added: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

// ✅ Get single Performa Invoice by ID
const getPerformaInvoiceById = async (req, res) => {
  try {
    const invoice = await PerformaInvoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

// ✅ Update Performa Invoice
const updatePerformaInvoice = async (req, res) => {
  try {
    const updatedInvoice = await PerformaInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updatedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

    res.json({
      message: "✅ Performa Invoice Updated",
      data: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// ✅ Delete Performa Invoice
const deletePerformaInvoice = async (req, res) => {
  try {
    const deletedInvoice = await PerformaInvoice.findByIdAndDelete(
      req.params.id,
    );

    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

    res.json({
      message: "🗑️ Performa Invoice Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  createPerformaInvoice,
  getAllPerformaInvoices,
  getPerformaInvoiceById,
  updatePerformaInvoice,
  deletePerformaInvoice,
};
