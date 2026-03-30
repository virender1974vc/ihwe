const CorporateVisitor = require("../../models/visitor/CorporateVisitorModel");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");

// ➤ Get all corporate visitors
const getAllCorporateVisitors = async (req, res) => {
  try {
    const visitors = await CorporateVisitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Get visitor by ID
const getCorporateVisitorById = async (req, res) => {
  try {
    const visitor = await CorporateVisitor.findById(req.params.id);

    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    res.json(visitor);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Create visitor
const createCorporateVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("corporate");

    const visitor = new CorporateVisitor({
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
const updateCorporateVisitor = async (req, res) => {
  try {
    const updated = await CorporateVisitor.findByIdAndUpdate(
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
const deleteCorporateVisitor = async (req, res) => {
  try {
    const deleted = await CorporateVisitor.findByIdAndDelete(req.params.id);

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
  getAllCorporateVisitors,
  getCorporateVisitorById,
  createCorporateVisitor,
  updateCorporateVisitor,
  deleteCorporateVisitor,
};
