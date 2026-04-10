const CrmState = require("../models/CrmState");

// GET all states
const getAllStates = async (req, res) => {
  try {
    const { countryCode } = req.query;
    const filter = countryCode ? { countryCode: Number(countryCode) } : {};
    const states = await CrmState.find(filter);
    res.status(200).json({
      message: "States fetched successfully",
      data: states,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching states",
      error: err.message,
    });
  }
};

// GET one state by ID
const getStateById = async (req, res) => {
  try {
    const state = await CrmState.findById(req.params.id);

    if (!state) return res.status(404).json({ message: "State not found" });

    res.json(state);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching state",
      error: err.message,
    });
  }
};

// CREATE state
const createState = async (req, res) => {
  try {
    const newState = new CrmState(req.body);
    const savedState = await newState.save();
    res.status(201).json(savedState);
  } catch (err) {
    res.status(500).json({
      message: "Error creating state",
      error: err.message,
    });
  }
};

// UPDATE state
const updateState = async (req, res) => {
  try {
    const updates = req.body || {};
    const state = await CrmState.findById(req.params.id);

    if (!state) return res.status(404).json({ message: "State not found" });

    const allowedFields = ["stateCode", "name", "countryCode"];

    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) state[key] = updates[key];
    });

    state.updatedAt = new Date();
    const savedState = await state.save();

    res.json(savedState);
  } catch (err) {
    res.status(500).json({
      message: "Error updating state",
      error: err.message,
    });
  }
};

// DELETE state
const deleteState = async (req, res) => {
  try {
    const state = await CrmState.findByIdAndDelete(req.params.id);

    if (!state) return res.status(404).json({ message: "State not found" });

    res.json({ message: "State deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting state",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
};
