const express = require("express");
const {
  getAllInternationalVisitors,
  getInternationalVisitorById,
  createInternationalVisitor,
  updateInternationalVisitor,
  deleteInternationalVisitor,
  bulkUploadInternationalVisitors,
} = require("../../controllers/visitor/internationalVisitorController.js");
const multer = require("multer");
const path = require("path");

const InternationalVisitor = require("../../models/visitor/InternationalVisitorModel");

// Set up multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const router = express.Router();

// Public: lookup visitor by registrationId (for QR scan)
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
router.post("/upload", upload.single("file"), bulkUploadInternationalVisitors);

// Create route with multer middleware to accept specific files
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

module.exports = router;
