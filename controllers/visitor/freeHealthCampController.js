const FreeHealthCamp = require("../../models/visitor/FreeHealthCampModel");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");

// ➤ Get all health camp visitors
const getAllHealthCampVisitors = async (req, res) => {
  try {
    const visitors = await FreeHealthCamp.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Get visitor by ID
const getHealthCampVisitorById = async (req, res) => {
  try {
    const visitor = await FreeHealthCamp.findById(req.params.id);

    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    res.json(visitor);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Create visitor
const createHealthCampVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("healthCamp");

    const visitor = new FreeHealthCamp({
      ...req.body,
      registrationId,
    });

    const saved = await visitor.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Update visitor
const updateHealthCampVisitor = async (req, res) => {
  try {
    const updated = await FreeHealthCamp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Visitor not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Delete visitor
const deleteHealthCampVisitor = async (req, res) => {
  try {
    const deleted = await FreeHealthCamp.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Visitor not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
};
