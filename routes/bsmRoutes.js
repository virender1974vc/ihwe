const express = require("express");
const router = express.Router();
const bsmController = require("../controllers/bsmController");

// --- PUBLIC / MATCHMAKING ---
router.get("/buyers", bsmController.getMatchmakingBuyers);
router.get("/exhibitors", bsmController.getMatchmakingExhibitors);
router.get("/buyers/categories", bsmController.getBuyerCategories);

// --- ADMIN ROUTES ---
router.post("/admin/create", bsmController.adminCreateMeeting);
router.get("/admin/all", bsmController.adminGetAllMeetings);
router.put("/admin/update/:id", bsmController.updateMeetingStatus);
router.put("/admin/approval/:id", bsmController.adminSetApproval);

// --- EXHIBITOR ROUTES ---
router.get("/exhibitor/:exhibitorId", bsmController.exhibitorGetMyMeetings);
router.get("/buyer/:buyerId", bsmController.buyerGetMyMeetings);
router.post("/exhibitor/request", bsmController.exhibitorRequestMeeting);
router.put("/exhibitor/respond/:id", bsmController.exhibitorRespondMeeting);

module.exports = router;
