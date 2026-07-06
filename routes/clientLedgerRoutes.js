const express = require("express");
const { getClientLedger, downloadClientStatement } = require("../controllers/clientLedgerController");

const router = express.Router();

router.get("/:companyId/statement", downloadClientStatement);
router.get("/:companyId", getClientLedger);

module.exports = router;
