const express = require("express");
const {
  getBankOptions,
  getBankOptionById,
  createBankOption,
  updateBankOption,
  deleteBankOption,
} = require("../controllers/bankOptionController.js");

const router = express.Router();

// CRUD routes
router.get("/", getBankOptions);
router.get("/:id", getBankOptionById);
router.post("/", createBankOption);
router.put("/:id", updateBankOption);
router.delete("/:id", deleteBankOption);

module.exports = router;
