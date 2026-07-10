const express = require("express");
const { getAccountsReceivable } = require("../controllers/accountsReceivableController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAccountsReceivable);

module.exports = router;
