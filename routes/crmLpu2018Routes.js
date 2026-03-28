const express = require("express");
const {
  getAllLpu,
  getLpuById,
  createLpu,
  updateLpu,
  deleteLpu,
} = require("../controllers/crmLpu2018Controller.js");

const router = express.Router();

router.get("/", getAllLpu);
router.get("/:id", getLpuById);
router.post("/", createLpu);
router.put("/:id", updateLpu);
router.delete("/:id", deleteLpu);

module.exports = router;
