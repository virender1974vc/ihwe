const CrmExhibatorReview2023 = require("../models/CrmExhibatorReview2023");

// GET all reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await CrmExhibatorReview2023.find().sort({ re_added: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: err.message,
    });
  }
};

// GET review by ID
const getReviewById = async (req, res) => {
  try {
    const review = await CrmExhibatorReview2023.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json(review);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching review",
      error: err.message,
    });
  }
};

// CREATE review
const createReview = async (req, res) => {
  try {
    const newReview = new CrmExhibatorReview2023(req.body);
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({
      message: "Error creating review",
      error: err.message,
    });
  }
};

// UPDATE review by ID
const updateReview = async (req, res) => {
  try {
    const updates = req.body || {};
    const review = await CrmExhibatorReview2023.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    const allowedFields = [
      "re_id",
      "cmpny_id",
      "evnt_id",
      "sender_id",
      "status_short",
      "reminder_dt",
      "forward_to",
      "re_msg",
      "re_msg_status",
      "area_txt",
      "rate_txt",
      "dis_txt",
      "amt_txt",
      "hsn_txt",
      "gst_txt",
      "gstper_txt",
      "finalamt_txt",
    ];

    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) review[key] = updates[key];
    });

    review.re_updated = new Date();
    const savedReview = await review.save();

    res.json(savedReview);
  } catch (err) {
    res.status(500).json({
      message: "Error updating review",
      error: err.message,
    });
  }
};

// DELETE review
const deleteReview = async (req, res) => {
  try {
    const review = await CrmExhibatorReview2023.findByIdAndDelete(
      req.params.id,
    );

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting review",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
