const express = require("express");
const {
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
} = require("../controllers/crmStateController.js");

const router = express.Router();

router.get("/", getAllStates);
router.get("/:id", getStateById);
router.post("/", createState);
router.put("/:id", updateState);
router.delete("/:id", deleteState);

module.exports = router;
