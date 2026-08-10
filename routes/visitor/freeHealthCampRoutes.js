const express = require("express");
const {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
  bulkResendHealthCampVisitorMessages,
  bulkUploadHealthCampVisitors,
} = require("../../controllers/visitor/freeHealthCampController.js");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", getAllHealthCampVisitors);
router.get("/:id", getHealthCampVisitorById);
router.post("/bulk-resend", bulkResendHealthCampVisitorMessages);
router.post("/upload", upload.single("file"), bulkUploadHealthCampVisitors);
router.post("/", createHealthCampVisitor);
router.put("/:id", updateHealthCampVisitor);
router.delete("/:id", deleteHealthCampVisitor);

module.exports = router;
