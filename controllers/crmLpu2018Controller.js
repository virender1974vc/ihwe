const CrmLpu2018 = require("../models/CrmLpu2018.js");

// GET all
const getAllLpu = async (req, res) => {
  try {
    const records = await CrmLpu2018.find();
    res.json(records);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching records", error: err.message });
  }
};

// GET by ID
const getLpuById = async (req, res) => {
  try {
    const record = await CrmLpu2018.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching record", error: err.message });
  }
};

// CREATE
const createLpu = async (req, res) => {
  try {
    const newRecord = new CrmLpu2018(req.body);
    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating record", error: err.message });
  }
};

// UPDATE
const updateLpu = async (req, res) => {
  try {
    const updates = req.body || {};
    const record = await CrmLpu2018.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) record[key] = updates[key];
    });

    record.ex_updated = new Date();
    const savedRecord = await record.save();
    res.json(savedRecord);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating record", error: err.message });
  }
};

// DELETE
const deleteLpu = async (req, res) => {
  try {
    const record = await CrmLpu2018.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting record", error: err.message });
  }
};

module.exports = {
  getAllLpu,
  getLpuById,
  createLpu,
  updateLpu,
  deleteLpu,
};
