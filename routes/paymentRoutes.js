const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  sendPaymentReceipt,
  downloadPaymentReceipt,
} = require("../controllers/paymentController.js");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Receipt links are emailed to clients, who do not have an admin auth token.
router.get("/:id/receipt", downloadPaymentReceipt);

router.use(authMiddleware);

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/payment_proofs");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `proof-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const proofUpload = multer({ storage: proofStorage });

router.post("/", proofUpload.single("paymentProof"), addPayment); // Create
router.get("/", getAllPayments); // Read all
router.get("/:id", getPaymentById); // Read one
router.put("/:id", updatePayment); // Update
router.delete("/:id", deletePayment); // Delete
router.post("/:id/send-receipt", sendPaymentReceipt); // Send Receipt

module.exports = router;
