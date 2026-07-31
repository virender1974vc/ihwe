const express = require("express");
const {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
  bulkResendHealthCampVisitorMessages,
} = require("../../controllers/visitor/freeHealthCampController.js");

const router = express.Router();

router.get("/", getAllHealthCampVisitors);
router.get("/:id", getHealthCampVisitorById);
router.post("/bulk-resend", bulkResendHealthCampVisitorMessages);
router.post("/", createHealthCampVisitor);
router.put("/:id", updateHealthCampVisitor);
router.delete("/:id", deleteHealthCampVisitor);

module.exports = router;
