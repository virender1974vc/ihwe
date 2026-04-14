const AnnualTurnover = require("../../models/add_by_admin/AnnualTurnover.js");

// GET all
const getAllAnnualTurnovers = async (req, res) => {
    try {
        const records = await AnnualTurnover.find({ status: 'Active' });
        res.json(records);
    } catch (err) {
        res.status(500).json({
            message: "Error fetching records",
            error: err.message,
        });
    }
};

// GET by ID
const getAnnualTurnoverById = async (req, res) => {
    try {
        const record = await AnnualTurnover.findById(req.params.id);
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
const createAnnualTurnover = async (req, res) => {
    try {
        const newRecord = new AnnualTurnover(req.body);
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
const updateAnnualTurnover = async (req, res) => {
    try {
        const updates = req.body || {};
        const record = await AnnualTurnover.findById(req.params.id);
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
const deleteAnnualTurnover = async (req, res) => {
    try {
        const record = await AnnualTurnover.findByIdAndDelete(req.params.id);
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
    getAllAnnualTurnovers,
    getAnnualTurnoverById,
    createAnnualTurnover,
    updateAnnualTurnover,
    deleteAnnualTurnover,
};

