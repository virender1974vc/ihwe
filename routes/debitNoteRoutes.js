const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createDebitNote,
  getDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
} = require("../controllers/debitNoteController.js");

const router = express.Router();

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/debit_notes");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `dn-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const attachmentUpload = multer({ storage: attachmentStorage });

router.post("/", attachmentUpload.single("attachment"), createDebitNote);
router.get("/", getDebitNotes);
router.get("/:id", getDebitNoteById);
router.put("/:id", updateDebitNote);
router.delete("/:id", deleteDebitNote);

module.exports = router;
