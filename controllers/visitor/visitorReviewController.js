const VisitorReview = require("../../models/visitor/VisitorReviewModel");

// CREATE
const createVisitorReview = async (req, res) => {
  try {
    const review = new VisitorReview(req.body);
    const saved = await review.save();
    res.status(201).json({ data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
const getAllVisitorReviews = async (req, res) => {
  try {
    const reviews = await VisitorReview.find().sort({ added: -1 });
    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY VISITOR ID
const getReviewsByVisitorId = async (req, res) => {
  try {
    const reviews = await VisitorReview.find({
      visitor_id: req.params.visitor_id,
    });
    res.json({ data: reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID
const getVisitorReviewById = async (req, res) => {
  try {
    const review = await VisitorReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    res.json({ data: review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
const updateVisitorReview = async (req, res) => {
  try {
    const updated = await VisitorReview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
const deleteVisitorReview = async (req, res) => {
  try {
    const deleted = await VisitorReview.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// EXPORT ALL
module.exports = {
  createVisitorReview,
  getAllVisitorReviews,
  getReviewsByVisitorId,
  getVisitorReviewById,
  updateVisitorReview,
  deleteVisitorReview,
};
