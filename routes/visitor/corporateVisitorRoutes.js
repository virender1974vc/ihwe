const express = require("express");
const {
  getAllCorporateVisitors,
  getCorporateVisitorById,
  createCorporateVisitor,
  updateCorporateVisitor,
  deleteCorporateVisitor,
} = require("../../controllers/visitor/corporateVisitorController.js");

const router = express.Router();

router.get("/", getAllCorporateVisitors);
router.get("/:id", getCorporateVisitorById);
router.post("/", createCorporateVisitor);
router.put("/:id", updateCorporateVisitor);
router.delete("/:id", deleteCorporateVisitor);

module.exports = router;
