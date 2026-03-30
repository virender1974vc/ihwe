const express = require("express");
const {
  getAllLoginLogs,
  getLoginLogById,
  createLoginLog,
  updateLoginLog,
  deleteLoginLog,
} = require("../controllers/crmLoginLogController.js");

const router = express.Router();

router.get("/", getAllLoginLogs);
router.get("/:id", getLoginLogById);
router.post("/", createLoginLog);
router.put("/:id", updateLoginLog);
router.delete("/:id", deleteLoginLog);

module.exports = router;
