const express = require("express");
const {
  addEstimate,
  getGroupedEstimateData,
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
} = require("../controllers/estimateController.js");

const router = express.Router();

router.get("/next-number", getNextEstimateNumber);
router.get("/grouped/:companyId", getGroupedEstimateData);
router.get("/", getAllEstimates);

router.post("/", addEstimate);

router.get("/:id", getEstimateById);
router.put("/:id", updateEstimate);
router.delete("/:id", deleteEstimate);

module.exports = router;
