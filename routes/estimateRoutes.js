const express = require("express");
const {
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  getEstimateImpactPreview,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
  sendWhatsAppEstimate,
  previewWhatsAppEstimate,
  sendEmailEstimate,
  previewEmailEstimate,
} = require("../controllers/estimateController.js");

const router = express.Router();

router.get("/next-number", getNextEstimateNumber);
router.get("/grouped/:companyId", getGroupedEstimateData);
router.get("/", getAllEstimates);

router.post("/", addEstimate);

router.post("/:id/impact-preview", getEstimateImpactPreview);
router.get("/:id", getEstimateById);
router.put("/:id", updateEstimate);
router.delete("/:id", deleteEstimate);
router.post("/:id/send-whatsapp", sendWhatsAppEstimate);
router.get("/:id/preview-whatsapp", previewWhatsAppEstimate);
router.post("/:id/send-email", sendEmailEstimate);
router.get("/:id/preview-email", previewEmailEstimate);

module.exports = router;
