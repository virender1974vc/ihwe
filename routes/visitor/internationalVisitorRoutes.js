const express = require("express");
const {
  getAllInternationalVisitors,
  getInternationalVisitorById,
  createInternationalVisitor,
  updateInternationalVisitor,
  deleteInternationalVisitor,
  bulkUploadInternationalVisitors,
  bulkResendInternationalVisitorMessages,
} = require("../../controllers/visitor/internationalVisitorController.js");
const multer = require("multer");
const { visitorExcelFileFilter, visitorUploadLimits, visitorUploadErrorHandler } = require("../../utils/visitorBulkUpload");

const InternationalVisitor = require("../../models/visitor/InternationalVisitorModel");

const upload = multer({ storage: multer.memoryStorage(), limits: visitorUploadLimits, fileFilter: visitorExcelFileFilter });

const router = express.Router();

router.get("/scan/:registrationId", async (req, res) => {
  try {
    const visitor = await InternationalVisitor.findOne({
      registrationId: req.params.registrationId,
    }).select("-__v");
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", getAllInternationalVisitors);
router.get("/:id", getInternationalVisitorById);
router.post("/bulk-resend", bulkResendInternationalVisitorMessages);
router.post("/upload", upload.single("file"), bulkUploadInternationalVisitors);

router.post(
  "/",
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "visitingCard", maxCount: 1 },
    { name: "companyProfile", maxCount: 1 },
    { name: "visaDocs", maxCount: 1 },
    { name: "photoId", maxCount: 1 },
  ]),
  createInternationalVisitor
);

router.put(
  "/:id",
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "visitingCard", maxCount: 1 },
    { name: "companyProfile", maxCount: 1 },
    { name: "visaDocs", maxCount: 1 },
    { name: "photoId", maxCount: 1 },
  ]),
  updateInternationalVisitor
);
router.delete("/:id", deleteInternationalVisitor);
router.use(visitorUploadErrorHandler);

module.exports = router;
