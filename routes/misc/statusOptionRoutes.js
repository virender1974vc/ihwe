const express = require("express");
const {
  createStatusOption,
  getStatusOptions,
  getStatusOptionById,
  updateStatusOption,
  deleteStatusOption,
} = require('../../controllers/misc/statusOptionController');

const router = express.Router();

router.post("/", createStatusOption); // ➤ Add new
router.get("/", getStatusOptions); // ➤ Get all
router.get("/:id", getStatusOptionById); // ➤ Get one
router.put("/:id", updateStatusOption); // ➤ Update
router.delete("/:id", deleteStatusOption); // ➤ Delete

module.exports = router;
