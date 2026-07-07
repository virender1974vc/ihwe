const express = require("express");
const { getAccountsReceivable } = require("../controllers/accountsReceivableController");

const router = express.Router();

router.get("/", getAccountsReceivable);

module.exports = router;
