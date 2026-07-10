const express = require("express");
const { getClientLedger, downloadClientStatement } = require("../controllers/clientLedgerController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:companyId/statement", downloadClientStatement);
router.get("/:companyId", getClientLedger);

module.exports = router;
