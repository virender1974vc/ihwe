const express = require("express");
const {
  getAllGeneralVisitors,
  getGeneralVisitorById,
  createGeneralVisitor,
  updateGeneralVisitor,
  deleteGeneralVisitor,
} = require("../../controllers/visitor/generalVisitorController.js");

const router = express.Router();

router.get("/", getAllGeneralVisitors);
router.get("/:id", getGeneralVisitorById);
router.post("/", createGeneralVisitor);
router.put("/:id", updateGeneralVisitor);
router.delete("/:id", deleteGeneralVisitor);

module.exports = router;
