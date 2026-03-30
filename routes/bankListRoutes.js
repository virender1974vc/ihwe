const express = require("express");
const {
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
} = require("../controllers/bankListController.js");

const router = express.Router();

// Routes
router.get("/", getBanks);
router.get("/:id", getBankById);
router.post("/", createBank);
router.put("/:id", updateBank);
router.delete("/:id", deleteBank);

module.exports = router;
