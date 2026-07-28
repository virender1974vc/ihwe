const NatureOfBusiness = require("../models/NatureOfBusiness");
const CrmUser = require("../models/CrmUser.js");
const { resequenceDisplayOrder } = require("../utils/displayOrder");

// GET all
const getAllNatures = async (req, res) => {
  try {
    const records = await NatureOfBusiness.find()
      .sort({ display_order: 1, nature_name: 1 })
      .lean();

    // Fetch all users to map username to full name
    const users = await CrmUser.find({}, 'user_name user_fullname').lean();
    const userMap = {};
    users.forEach(u => {
        if (u.user_name) userMap[u.user_name] = u.user_fullname || u.user_name;
    });

    // Map updated_by to full name
    const mappedRecords = records.map(record => ({
        ...record,
        updated_by: userMap[record.updated_by] || record.updated_by
    }));

    res.json(mappedRecords);
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
    await resequenceDisplayOrder(
      NatureOfBusiness,
      savedRecord._id,
      req.body.display_order,
    );
    const orderedRecord = await NatureOfBusiness.findById(savedRecord._id);

    res.status(201).json(orderedRecord);
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
    if (updates.display_order !== undefined) {
      await resequenceDisplayOrder(
        NatureOfBusiness,
        savedRecord._id,
        updates.display_order,
      );
    }
    const orderedRecord = await NatureOfBusiness.findById(savedRecord._id);

    res.json(orderedRecord);
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
