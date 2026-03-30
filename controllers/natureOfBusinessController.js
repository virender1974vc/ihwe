const NatureOfBusiness = require("../models/NatureOfBusiness");

// GET all
const getAllNatures = async (req, res) => {
  try {
    const records = await NatureOfBusiness.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching records",
      error: err.message,
    });
  }
};

// GET by ID
const getNatureById = async (req, res) => {
  try {
    const record = await NatureOfBusiness.findById(req.params.id);

    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json(record);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching record",
      error: err.message,
    });
  }
};

// CREATE
const createNature = async (req, res) => {
  try {
    const newRecord = new NatureOfBusiness(req.body);
    const savedRecord = await newRecord.save();

    res.status(201).json(savedRecord);
  } catch (err) {
    res.status(500).json({
      message: "Error creating record",
      error: err.message,
    });
  }
};

// UPDATE
const updateNature = async (req, res) => {
  try {
    const updates = req.body || {};

    const record = await NatureOfBusiness.findById(req.params.id);

    if (!record) return res.status(404).json({ message: "Record not found" });

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) record[key] = updates[key];
    });

    record.updated = new Date();

    const savedRecord = await record.save();

    res.json(savedRecord);
  } catch (err) {
    res.status(500).json({
      message: "Error updating record",
      error: err.message,
    });
  }
};

// DELETE
const deleteNature = async (req, res) => {
  try {
    const record = await NatureOfBusiness.findByIdAndDelete(req.params.id);

    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting record",
      error: err.message,
    });
  }
};

// EXPORT
module.exports = {
  getAllNatures,
  getNatureById,
  createNature,
  updateNature,
  deleteNature,
};
