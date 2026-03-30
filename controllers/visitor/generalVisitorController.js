const GeneralVisitor = require("../../models/visitor/GeneralVisitorModel");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");

exports.getAllGeneralVisitors = async (req, res) => {
  try {
    const visitors = await GeneralVisitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGeneralVisitorById = async (req, res) => {
  try {
    const visitor = await GeneralVisitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGeneralVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("general");

    req.body.registrationId = registrationId;
    const visitor = new GeneralVisitor({ ...req.body, registrationId });
    const saved = await visitor.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGeneralVisitor = async (req, res) => {
  try {
    const updated = await GeneralVisitor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Visitor not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGeneralVisitor = async (req, res) => {
  try {
    const deleted = await GeneralVisitor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Visitor not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
