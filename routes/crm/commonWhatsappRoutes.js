const express = require("express");
const {
  getWhatsappRecords,
  getWhatsappRecordById,
  createWhatsappRecord,
  updateWhatsappRecord,
  deleteWhatsappRecord,
} = require('../../controllers/crm/commonWhatsappController');

const router = express.Router();

// CRUD routes
router.get("/", getWhatsappRecords);
router.get("/:id", getWhatsappRecordById);
router.post("/", createWhatsappRecord);
router.put("/:id", updateWhatsappRecord);
router.delete("/:id", deleteWhatsappRecord);

module.exports = router;
