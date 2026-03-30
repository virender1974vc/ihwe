const express = require("express");
const {
  addEstimate,
  getGroupedEstimateData,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getNextEstimateNumber,
} = require("../controllers/estimateController.js");

const router = express.Router();

router.get("/next-number", getNextEstimateNumber);
router.get("/grouped/:companyId", getGroupedEstimateData);

router.post("/", addEstimate);

router.get("/:id", getEstimateById);
router.put("/:id", updateEstimate);
router.delete("/:id", deleteEstimate);

module.exports = router;
