const express = require("express");
const {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogById,
  deleteActivityLog,
} = require('../../controllers/misc/activityLogController');

const router = express.Router();

router.post("/create", createActivityLog);
router.get("/", getAllActivityLogs);
router.get("/:id", getActivityLogById);
router.delete("/:id", deleteActivityLog);

module.exports = router;
