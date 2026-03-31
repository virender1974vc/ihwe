const express = require("express");
const {
  createPerformaInvoice,
  getAllPerformaInvoices,
  getPerformaInvoiceById,
  updatePerformaInvoice,
  deletePerformaInvoice,
} = require("../controllers/perInvoiceController.js");

const router = express.Router();

router.post("/", createPerformaInvoice);
router.get("/", getAllPerformaInvoices);
router.get("/:id", getPerformaInvoiceById);
router.put("/:id", updatePerformaInvoice);
router.delete("/:id", deletePerformaInvoice);

module.exports = router;
