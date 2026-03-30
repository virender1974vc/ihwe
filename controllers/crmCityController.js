const CrmCity = require("../models/CrmCity.js");

// ➤ GET all cities
const getAllCities = async (req, res) => {
  try {
    const cities = await CrmCity.find();
    res
      .status(200)
      .json({ message: "Cities fetched successfully", data: cities });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching cities", error: err.message });
  }
};

// ➤ GET city by ID
const getCityById = async (req, res) => {
  try {
    const city = await CrmCity.findById(req.params.id);
    if (!city) return res.status(404).json({ message: "City not found" });
    res.status(200).json({ message: "City fetched successfully", data: city });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching city", error: err.message });
  }
};

// ➤ CREATE new city
const createCity = async (req, res) => {
  try {
    const newCity = new CrmCity(req.body);
    const savedCity = await newCity.save();

    res
      .status(201)
      .json({ message: "City created successfully", data: savedCity });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating city", error: err.message });
  }
};

// ➤ UPDATE city by ID
const updateCity = async (req, res) => {
  try {
    const updates = req.body || {};
    const city = await CrmCity.findById(req.params.id);
    if (!city) return res.status(404).json({ message: "City not found" });

    const allowedFields = ["cityCode", "name", "stateCode"];
    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) city[key] = updates[key];
    });

    city.updatedAt = new Date();
    const savedCity = await city.save();

    res
      .status(200)
      .json({ message: "City updated successfully", data: savedCity });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating city", error: err.message });
  }
};

// ➤ DELETE city by ID
const deleteCity = async (req, res) => {
  try {
    const city = await CrmCity.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ message: "City not found" });

    res.status(200).json({ message: "City deleted successfully", data: city });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting city", error: err.message });
  }
};

module.exports = {
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
};
