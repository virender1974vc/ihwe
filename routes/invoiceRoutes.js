const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice, // यह फंक्शन अब invoice_no को जेनरेट करेगा
  previewInvoiceRevision,
  reviseInvoiceFromEstimate,
  updateInvoice,
  deleteInvoice,
  sendWhatsAppInvoice,
  previewWhatsAppInvoice,
  sendEmailInvoice,
  previewEmailInvoice,
  uploadInvoiceAttachments,
  uploadInvoicePoAttachment,
} = require("../controllers/invoiceController.js");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/invoices");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9_-]/gi, "-");
    cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
  },
});
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => cb(null, ["application/pdf", "image/png", "image/jpeg"].includes(file.mimetype)),
});
const uploadAttachments = (req, res, next) => {
  attachmentUpload.array("attachments", 10)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Each attachment must be 25MB or smaller." });
    }
    return res.status(400).json({ message: error.message || "Unable to upload attachments." });
  });
};
const uploadPoAttachment = (req, res, next) => {
  attachmentUpload.single("po_attachment")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "The PO file must be 25MB or smaller." });
    }
    return res.status(400).json({ message: error.message || "Unable to upload PO attachment." });
  });
};

router.get("/", getAllInvoices); // GET all invoices
router.get("/:id/revision-preview", previewInvoiceRevision);
router.post("/:id/revise-from-estimate", reviseInvoiceFromEstimate);
router.get("/:id", getInvoiceById); // GET single invoice
router.post("/", createInvoice); // CREATE invoice
router.post("/:id/attachments", uploadAttachments, uploadInvoiceAttachments);
router.post("/:id/po-attachment", uploadPoAttachment, uploadInvoicePoAttachment);
router.put("/:id", updateInvoice); // UPDATE invoice
router.delete("/:id", deleteInvoice); // DELETE invoice
router.post("/:id/send-whatsapp", sendWhatsAppInvoice);
router.get("/:id/preview-whatsapp", previewWhatsAppInvoice);
router.post("/:id/send-email", sendEmailInvoice);
router.get("/:id/preview-email", previewEmailInvoice);

module.exports = router;
