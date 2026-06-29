const express = require("express");
const { getAccountOverview } = require("../controllers/accountOverviewController");

const router = express.Router();

router.get("/:companyId", getAccountOverview);

module.exports = router;
