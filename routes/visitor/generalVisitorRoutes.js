const express = require("express");
const {
  getAllGeneralVisitors,
  getGeneralVisitorById,
  createGeneralVisitor,
  updateGeneralVisitor,
  deleteGeneralVisitor,
  bulkResendGeneralVisitorMessages,
} = require("../../controllers/visitor/generalVisitorController.js");

const GeneralVisitor = require("../../models/visitor/GeneralVisitorModel");

const router = express.Router();
router.get("/scan/:registrationId", async (req, res) => {
  try {
    const visitor = await GeneralVisitor.findOne({
      registrationId: req.params.registrationId,
    }).select("-__v");
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", getAllGeneralVisitors);
router.get("/:id", getGeneralVisitorById);
router.post("/bulk-resend", bulkResendGeneralVisitorMessages);
router.post("/", createGeneralVisitor);
router.put("/:id", updateGeneralVisitor);
router.delete("/:id", deleteGeneralVisitor);

module.exports = router;
