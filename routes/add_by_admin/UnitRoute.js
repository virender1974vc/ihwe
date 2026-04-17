const express = require("express");
const {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} = require("../../controllers/add_by_admin/UnitController.js");

const router = express.Router();

router.get("/", getAllUnits);
router.get("/:id", getUnitById);
router.post("/", createUnit);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);

module.exports = router;