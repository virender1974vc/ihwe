const express = require("express");
const {
  createVisitorReview,
  getAllVisitorReviews,
  getReviewsByVisitorId,
  getVisitorReviewById,
  updateVisitorReview,
  deleteVisitorReview,
} = require("../../controllers/visitor/visitorReviewController.js");

const router = express.Router();

router.post("/", createVisitorReview);
router.get("/", getAllVisitorReviews);
router.get("/visitor/:visitor_id", getReviewsByVisitorId);
router.get("/:id", getVisitorReviewById);
router.put("/:id", updateVisitorReview);
router.delete("/:id", deleteVisitorReview);

module.exports = router;
