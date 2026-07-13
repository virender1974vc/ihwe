const express = require("express");
const {
  getAllCorporateVisitors,
  getCorporateVisitorById,
  createCorporateVisitor,
  updateCorporateVisitor,
  deleteCorporateVisitor,
  uploadCorporateVisitors,
} = require("../../controllers/visitor/corporateVisitorController.js");
const multer = require("multer");
const path = require("path");

const upload = multer({ dest: path.join(__dirname, "../../uploads/") });

const CorporateVisitor = require("../../models/visitor/CorporateVisitorModel");

const router = express.Router();

// ➤ Public: lookup visitor by registrationId (for QR scan)
router.get("/scan/:registrationId", async (req, res) => {
  try {
    const visitor = await CorporateVisitor.findOne({
      registrationId: req.params.registrationId,
    }).select("-__v");
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", getAllCorporateVisitors);
router.get("/:id", getCorporateVisitorById);
router.post("/upload", upload.single("file"), uploadCorporateVisitors);
router.post("/", createCorporateVisitor);
router.put("/:id", updateCorporateVisitor);
router.delete("/:id", deleteCorporateVisitor);

module.exports = router;
