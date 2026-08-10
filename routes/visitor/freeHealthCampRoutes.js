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
const { visitorExcelFileFilter, visitorUploadLimits, visitorUploadErrorHandler } = require("../../utils/visitorBulkUpload");
const upload = multer({ storage: multer.memoryStorage(), limits: visitorUploadLimits, fileFilter: visitorExcelFileFilter });

const FreeHealthCamp = require("../../models/visitor/FreeHealthCampModel");

const router = express.Router();
router.get("/scan/:registrationId", async (req, res) => {
  try {
    const visitor = await FreeHealthCamp.findOne({
      registrationId: req.params.registrationId,
    }).select("-__v");
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", getAllHealthCampVisitors);
router.get("/:id", getHealthCampVisitorById);
router.post("/bulk-resend", bulkResendHealthCampVisitorMessages);
router.post("/upload", upload.single("file"), bulkUploadHealthCampVisitors);
router.post("/", createHealthCampVisitor);
router.put("/:id", updateHealthCampVisitor);
router.delete("/:id", deleteHealthCampVisitor);
router.use(visitorUploadErrorHandler);

module.exports = router;
