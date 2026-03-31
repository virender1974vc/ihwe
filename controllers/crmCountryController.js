const CrmCountry = require("../models/CrmCountry");

// GET all countries
const getAllCountries = async (req, res) => {
  try {
    const countries = await CrmCountry.find();
    res.status(200).json({
      message: "Countries fetched successfully",
      data: countries,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching countries",
      error: err.message,
    });
  }
};

// GET country by ID
const getCountryById = async (req, res) => {
  try {
    const country = await CrmCountry.findById(req.params.id);
    if (!country) return res.status(404).json({ message: "Country not found" });

    res.json(country);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching country",
      error: err.message,
    });
  }
};

// CREATE new country
const createCountry = async (req, res) => {
  try {
    const newCountry = new CrmCountry(req.body);
    const savedCountry = await newCountry.save();
    res.status(201).json(savedCountry);
  } catch (err) {
    res.status(500).json({
      message: "Error creating country",
      error: err.message,
    });
  }
};

// UPDATE country by ID
const updateCountry = async (req, res) => {
  try {
    const updates = req.body || {};
    const country = await CrmCountry.findById(req.params.id);

    if (!country) return res.status(404).json({ message: "Country not found" });

    const allowedFields = ["countryCode", "sortName", "name", "updated_by"];

    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) country[key] = updates[key];
    });

    country.updatedAt = new Date();
    const savedCountry = await country.save();

    res.json(savedCountry);
  } catch (err) {
    res.status(500).json({
      message: "Error updating country",
      error: err.message,
    });
  }
};

// DELETE country by ID
const deleteCountry = async (req, res) => {
  try {
    const country = await CrmCountry.findByIdAndDelete(req.params.id);

    if (!country) return res.status(404).json({ message: "Country not found" });

    res.json({ message: "Country deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting country",
      error: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
};
