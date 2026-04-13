const express = require("express");
const {
    getAllMeetingPriorityLevels,
    getMeetingPriorityLevelById,
    createMeetingPriorityLevel,
    updateMeetingPriorityLevel,
    deleteMeetingPriorityLevel
} = require("../../controllers/add_by_admin/MeetingPriorityLevelController.js");

const router = express.Router();

router.get("/", getAllMeetingPriorityLevels);
router.get("/:id", getMeetingPriorityLevelById);
router.post("/", createMeetingPriorityLevel);
router.put("/:id", updateMeetingPriorityLevel);
router.delete("/:id", deleteMeetingPriorityLevel);

module.exports = router;