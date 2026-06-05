const express = require("express");
const {
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
  sendWhatsAppEstimate,
  sendEmailEstimate,
} = require("../controllers/estimateController.js");

const router = express.Router();

router.get("/next-number", getNextEstimateNumber);
router.get("/grouped/:companyId", getGroupedEstimateData);
router.get("/", getAllEstimates);

router.post("/", addEstimate);

router.get("/:id", getEstimateById);
router.put("/:id", updateEstimate);
router.delete("/:id", deleteEstimate);
router.post("/:id/send-whatsapp", sendWhatsAppEstimate);
router.post("/:id/send-email", sendEmailEstimate);

module.exports = router;
