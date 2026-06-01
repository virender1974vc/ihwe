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
    const { search, status, source, industry, page, limit, countOnly, dashboard, username, role, startDate, endDate, forwardTo } = req.query;

    let query = {};

    // Authorization filter
    const lowerUsername = username ? username.toLowerCase() : null;
    const cleanRole = role ? role.toLowerCase().replace(/[^a-z]/g, '') : '';
    const isSuperAdmin = cleanRole === 'superadmin';

    if (lowerUsername && !isSuperAdmin) {
      query.$or = [
        { forwardTo: { $regex: new RegExp(`^${lowerUsername}$`, 'i') } },
        { added_by: { $regex: new RegExp(`^${lowerUsername}$`, 'i') } },
      ];
    }

    if (dashboard === 'true') {
      const companies = await Company.find(query)
        .select('companyName companyStatus forwardTo added_by contacts reminder updatedAt lastNote')
        .sort({ createdAt: -1 })
        .limit(3000)
        .lean();
      return res.status(200).json(companies);
    }

    // Filters
    if (status) query.companyStatus = { $regex: new RegExp(`^${escapeRegex(status)}$`, 'i') };
    if (source) query.dataSource = { $regex: new RegExp(`^${escapeRegex(source)}$`, 'i') };
    if (industry) query.businessNature = { $regex: new RegExp(`^${escapeRegex(industry)}$`, 'i') };
    if (forwardTo) query.forwardTo = { $regex: new RegExp(`^${escapeRegex(forwardTo)}$`, 'i') };

    // Date Range Filter (using createdAt)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const searchOr = [
        { companyName: searchRegex },
        { email: searchRegex },
        { "contacts.mobile": searchRegex },
        { "contacts.name": searchRegex }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (countOnly === 'true') {
      const count = await Company.countDocuments(query);
      return res.status(200).json({ count });
    }

    // Pagination
    if (page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const total = await Company.countDocuments(query);
      const companies = await Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      return res.status(200).json({
        data: companies,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }

    const companies = await Company.find(query).sort({ createdAt: -1 }).limit(3000).lean();
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
      returnDocument: 'after',
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

// ➤ Upload company logo
const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const logoUrl = `/uploads/company_logos/${req.file.filename}`;
    const updated = await Company.findByIdAndUpdate(req.params.id, { companyLogo: logoUrl }, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ message: "Logo updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error uploading logo", error: error.message });
  }
};
const uploadContactPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const photoUrl = `/uploads/contact_photos/${req.file.filename}`;
    res.status(200).json({ message: "Contact photo uploaded successfully", photoUrl });
  } catch (error) {
    res.status(500).json({ message: "Error uploading contact photo", error: error.message });
  }
};

module.exports = {
  addCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  uploadContactPhoto,
};
