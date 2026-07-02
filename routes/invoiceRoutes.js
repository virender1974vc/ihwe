const express = require("express");
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice, // यह फंक्शन अब invoice_no को जेनरेट करेगा
  updateInvoice,
  deleteInvoice,
  sendWhatsAppInvoice,
  previewWhatsAppInvoice,
  sendEmailInvoice,
  previewEmailInvoice,
} = require("../controllers/invoiceController.js");

const router = express.Router();

router.get("/", getAllInvoices); // GET all invoices
router.get("/:id", getInvoiceById); // GET single invoice
router.post("/", createInvoice); // CREATE invoice
router.put("/:id", updateInvoice); // UPDATE invoice
router.delete("/:id", deleteInvoice); // DELETE invoice
router.post("/:id/send-whatsapp", sendWhatsAppInvoice);
router.get("/:id/preview-whatsapp", previewWhatsAppInvoice);
router.post("/:id/send-email", sendEmailInvoice);
router.get("/:id/preview-email", previewEmailInvoice);

module.exports = router;
