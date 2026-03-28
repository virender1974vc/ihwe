const CrmLoginLog = require("../models/CrmLoginLog");

// GET all login logs
const getAllLoginLogs = async (req, res) => {
  try {
    const logs = await CrmLoginLog.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching logs",
      error: err.message,
    });
  }
};

// GET login log by ID
const getLoginLogById = async (req, res) => {
  try {
    const log = await CrmLoginLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: "Log not found" });

    res.json(log);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching log",
      error: err.message,
    });
  }
};

// CREATE new login log
const createLoginLog = async (req, res) => {
  try {
    const newLog = new CrmLoginLog(req.body);
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (err) {
    res.status(500).json({
      message: "Error creating log",
      error: err.message,
    });
  }
};

// UPDATE login log by ID
const updateLoginLog = async (req, res) => {
  try {
    const updates = req.body || {};
    const log = await CrmLoginLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: "Log not found" });

    const allowedFields = [
      "user_id",
      "browser",
      "platform",
      "ip_address",
      "login_time",
    ];

    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) log[key] = updates[key];
    });

    log.updated = new Date();
    const savedLog = await log.save();

    res.json(savedLog);
  } catch (err) {
    res.status(500).json({
      message: "Error updating log",
      error: err.message,
    });
  }
};

// DELETE login log by ID
const deleteLoginLog = async (req, res) => {
  try {
    const log = await CrmLoginLog.findByIdAndDelete(req.params.id);

    if (!log) return res.status(404).json({ message: "Log not found" });

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting log",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllLoginLogs,
  getLoginLogById,
  createLoginLog,
  updateLoginLog,
  deleteLoginLog,
};
