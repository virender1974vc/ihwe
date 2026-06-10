const express = require("express");
const {
  getAllBusinessTypes,
  getBusinessTypeById,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType
} = require('../../controllers/misc/BusinessTypeController');

const router = express.Router();

router.get("/", getAllBusinessTypes);
router.get("/:id", getBusinessTypeById);
router.post("/", createBusinessType);
router.put("/:id", updateBusinessType);
router.delete("/:id", deleteBusinessType);

module.exports = router;
