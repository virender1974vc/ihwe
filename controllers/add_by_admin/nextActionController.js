const NextAction = require("../../models/add_by_admin/NextAction");

const createNextAction = async (req, res) => {
  try {
    const record = new NextAction(req.body);
    await record.save();
    res.status(201).json({ message: "Next Action created successfully", data: record });
  } catch (err) {
    res.status(500).json({ message: "Error creating Next Action", error: err.message });
  }
};

const getNextActions = async (req, res) => {
  try {
    const records = await NextAction.find().sort({ name: 1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: "Error fetching Next Actions", error: err.message });
  }
};

const getNextActionById = async (req, res) => {
  try {
    const record = await NextAction.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: "Error fetching Next Action", error: err.message });
  }
};

const updateNextAction = async (req, res) => {
  try {
    const updated = await NextAction.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Next Action updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating Next Action", error: err.message });
  }
};

const deleteNextAction = async (req, res) => {
  try {
    const deleted = await NextAction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Next Action deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting Next Action", error: err.message });
  }
};

module.exports = { createNextAction, getNextActions, getNextActionById, updateNextAction, deleteNextAction };
