const Unit = require("../../models/add_by_admin/Unit.js");

// GET all
const getAllUnits = async (req, res) => {
    try {
        const units = await Unit.find();
        res.status(200).json(units);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET by ID
const getUnitById = async (req, res) => {
    try {
        const unit = await Unit.findById(req.params.id);
        res.status(200).json(unit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE
const createUnit = async (req, res) => {
    try {
        const { unit, status, added_by, updated_by } = req.body;
        const newUnit = new Unit({ unit, status, added_by, updated_by });
        await newUnit.save();
        res.status(201).json(newUnit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE
const updateUnit = async (req, res) => {
    try {
        const { unit, status, added_by, updated_by } = req.body;
        const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, { unit, status, added_by, updated_by }, { new: true });
        res.status(200).json(updatedUnit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE
const deleteUnit = async (req, res) => {
    try {
        const deletedUnit = await Unit.findByIdAndDelete(req.params.id);
        res.status(200).json(deletedUnit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// EXPORT
module.exports = {
    getAllUnits,
    getUnitById,
    createUnit,
    updateUnit,
    deleteUnit,
};