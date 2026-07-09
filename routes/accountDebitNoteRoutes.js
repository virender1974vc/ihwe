const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getCompanyDebitNoteContext,
  getNextDebitNoteNo,
  createAccountDebitNote,
  getAccountDebitNotes,
  getAccountDebitNoteById,
  updateAccountDebitNote,
  deleteAccountDebitNote,
} = require("../controllers/accountDebitNoteController.js");

const router = express.Router();

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/account_debit_notes");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `adn-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const attachmentUpload = multer({ storage: attachmentStorage });

router.get("/next-number", getNextDebitNoteNo);
router.get("/company/:companyId/context", getCompanyDebitNoteContext);
router.post("/", attachmentUpload.single("attachment"), createAccountDebitNote);
router.get("/", getAccountDebitNotes);
router.get("/:id", getAccountDebitNoteById);
router.put("/:id", attachmentUpload.single("attachment"), updateAccountDebitNote);
router.delete("/:id", deleteAccountDebitNote);

module.exports = router;
