const express = require("express");
const {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
} = require("../../controllers/visitor/freeHealthCampController.js");

const router = express.Router();

router.get("/", getAllHealthCampVisitors);
router.get("/:id", getHealthCampVisitorById);
router.post("/", createHealthCampVisitor);
router.put("/:id", updateHealthCampVisitor);
router.delete("/:id", deleteHealthCampVisitor);

module.exports = router;
