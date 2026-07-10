const express = require("express");
const {
  getEstimateTermsConfig,
  updateEstimateTermsConfig,
} = require("../controllers/estimateTermsConfigController");

const router = express.Router();

router.get("/", getEstimateTermsConfig);
router.get("/:documentType", getEstimateTermsConfig);
router.put("/", updateEstimateTermsConfig);
router.put("/:documentType", updateEstimateTermsConfig);

module.exports = router;
