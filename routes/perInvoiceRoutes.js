const express = require("express");
const {
  createPerformaInvoice,
  getAllPerformaInvoices,
  getPerformaInvoiceById,
  updatePerformaInvoice,
  deletePerformaInvoice,
} = require("../controllers/perInvoiceController.js");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createPerformaInvoice);
router.get("/", getAllPerformaInvoices);
router.get("/:id", getPerformaInvoiceById);
router.put("/:id", updatePerformaInvoice);
router.delete("/:id", deletePerformaInvoice);

module.exports = router;
