const express = require("express");
const {
  getAllSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
} = require('../../controllers/misc/dataSourceController');

const router = express.Router();

router.get("/", getAllSources);
router.get("/:id", getSourceById);
router.post("/", createSource);
router.put("/:id", updateSource);
router.delete("/:id", deleteSource);

module.exports = router;
