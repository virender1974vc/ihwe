const Invoice = require("../models/Invoice");

// 📍 GET all invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ added: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

// 📍 GET single invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

// 📍 CREATE new invoice
const createInvoice = async (req, res) => {
  try {
    // Required fields check
    const requiredFields = [
      "companyId",
      "estimate_no",
      "type_of_invoice",
      "gst_no",
      "supply_date",
      "consignee_name",
      "consignee_addr",
      "country",
      "state",
      "city",
      "pincode",
      "added_by",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Generate invoice number
    const invoice_no = await Invoice.generateNextInvoiceNumber();

    const newInvoice = new Invoice({
      ...req.body,
      invoice_no,
    });

    const savedInvoice = await newInvoice.save();

    res.status(201).json({
      message: "✅ Invoice Created",
      data: savedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);

    res.status(500).json({
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

// 📍 UPDATE invoice
const updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updatedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({
      message: "✅ Invoice Updated",
      data: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// 📍 DELETE invoice
const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({
      message: "🗑️ Invoice deleted successfully",
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
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
