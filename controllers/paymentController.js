const Payment = require("../models/Payment");

// ➤ Add a new payment
const addPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();

    res.status(201).json({
      message: "Payment added successfully",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding payment",
      error: error.message,
    });
  }
};

// ➤ Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ added: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// ➤ Get a single payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

// ➤ Update payment
const updatePayment = async (req, res) => {
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updatedPayment)
      return res.status(404).json({ message: "Payment not found" });

    res.status(200).json({
      message: "✏️ Payment updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating payment",
      error: error.message,
    });
  }
};

// ➤ Delete payment
const deletePayment = async (req, res) => {
  try {
    const deletedPayment = await Payment.findByIdAndDelete(req.params.id);

    if (!deletedPayment)
      return res.status(404).json({ message: "Payment not found" });

    res.status(200).json({
      message: "🗑️ Payment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting payment",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};
