const express = require("express");
const {
  getAllNatures,
  getNatureById,
  createNature,
  updateNature,
  deleteNature,
} = require("../controllers/natureOfBusinessController.js");

const router = express.Router();

router.get("/", getAllNatures);
router.get("/:id", getNatureById);
router.post("/", createNature);
router.put("/:id", updateNature);
router.delete("/:id", deleteNature);

module.exports = router;
