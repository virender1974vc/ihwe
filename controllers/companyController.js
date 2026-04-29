const Company = require("../models/Company.js");
const { logActivity } = require("../utils/logger");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ➤ Add new company
const addCompany = async (req, res) => {
  try {
    // --- Duplicate Validation ---
    const orConditions = [];
    if (req.body.companyName) {
      orConditions.push({ companyName: { $regex: new RegExp(`^${escapeRegex(req.body.companyName)}$`, "i") } });
    }
    if (req.body.email) {
      orConditions.push({ email: { $regex: new RegExp(`^${escapeRegex(req.body.email)}$`, "i") } });
    }
    if (req.body.contacts && Array.isArray(req.body.contacts)) {
      const mobiles = req.body.contacts.map((c) => c.mobile).filter(Boolean);
      if (mobiles.length > 0) {
        orConditions.push({ "contacts.mobile": { $in: mobiles } });
      }
    }

    if (orConditions.length > 0) {
      const existing = await Company.findOne({ $or: orConditions });
      if (existing) {
        let errMsg = "Duplicate record found.";
        if (req.body.companyName && existing.companyName.toLowerCase() === req.body.companyName.toLowerCase()) {
          errMsg = "Company Name already exists.";
        } else if (req.body.email && existing.email.toLowerCase() === req.body.email.toLowerCase()) {
          errMsg = "Official Email already exists.";
        } else {
          errMsg = "Mobile Number already exists.";
        }
        return res.status(409).json({ message: errMsg, success: false });
      }
    }

    const newCompany = new Company(req.body);
    await newCompany.save();

    await logActivity(req, "Created", "Client Data", `Added new company: ${req.body.companyName}`);

    res.status(201).json({
      message: "Company added successfully",
      data: newCompany,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding company",
      error: error.message,
    });
  }
};

// ➤ Get all companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

// ➤ Get single company
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching company",
      error: error.message,
    });
  }
};

// ➤ Update company
const updateCompany = async (req, res) => {
  try {
    // --- Duplicate Validation ---
    const orConditions = [];
    if (req.body.companyName) {
      orConditions.push({ companyName: { $regex: new RegExp(`^${escapeRegex(req.body.companyName)}$`, "i") } });
    }
    if (req.body.email) {
      orConditions.push({ email: { $regex: new RegExp(`^${escapeRegex(req.body.email)}$`, "i") } });
    }
    if (req.body.contacts && Array.isArray(req.body.contacts)) {
      const mobiles = req.body.contacts.map((c) => c.mobile).filter(Boolean);
      if (mobiles.length > 0) {
        orConditions.push({ "contacts.mobile": { $in: mobiles } });
      }
    }

    if (orConditions.length > 0) {
      const existing = await Company.findOne({
        $and: [{ _id: { $ne: req.params.id } }, { $or: orConditions }],
      });

      if (existing) {
        let errMsg = "Duplicate record found.";
        if (req.body.companyName && existing.companyName.toLowerCase() === req.body.companyName.toLowerCase()) {
          errMsg = "Company Name already exists.";
        } else if (req.body.email && existing.email.toLowerCase() === req.body.email.toLowerCase()) {
          errMsg = "Official Email already exists.";
        } else {
          errMsg = "Mobile Number already exists.";
        }
        return res.status(409).json({ message: errMsg, success: false });
      }
    }

    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Company not found" });

    await logActivity(req, "Updated", "Client Data", `Updated company: ${updated.companyName}`);

    res.status(200).json({
      message: "Company updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating company",
      error: error.message,
    });
  }
};

// ➤ Delete company
const deleteCompany = async (req, res) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Company not found" });

    await logActivity(req, "Deleted", "Client Data", `Deleted company: ${deleted.companyName}`);

    res.status(200).json({
      message: "Company deleted successfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting company",
      error: error.message,
    });
  }
};

module.exports = {
  addCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
