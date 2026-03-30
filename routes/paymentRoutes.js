const express = require("express");
const {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/", addPayment); // Create
router.get("/", getAllPayments); // Read all
router.get("/:id", getPaymentById); // Read one
router.put("/:id", updatePayment); // Update
router.delete("/:id", deletePayment); // Delete

module.exports = router;
