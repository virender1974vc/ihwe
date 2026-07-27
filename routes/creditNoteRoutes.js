const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
} = require("../controllers/creditNoteController.js");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, "cn-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.post("/", upload.single("attachment"), createCreditNote);

router.get("/", getCreditNotes);

router.get("/:id", getCreditNoteById);

router.put("/:id", upload.single("attachment"), updateCreditNote);

router.delete("/:id", deleteCreditNote);

module.exports = router;
