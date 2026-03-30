const express = require("express");

const {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
} = require("../controllers/creditNoteController.js");

const router = express.Router();

router.post("/", createCreditNote);

router.get("/", getCreditNotes);

router.get("/:id", getCreditNoteById);

router.put("/:id", updateCreditNote);

router.delete("/:id", deleteCreditNote);

module.exports = router;
