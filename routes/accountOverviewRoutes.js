const express = require("express");
const { getAccountOverview } = require("../controllers/accountOverviewController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:companyId", authMiddleware, getAccountOverview);

module.exports = router;
