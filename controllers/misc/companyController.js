const XLSX = require("xlsx");
const fs = require("fs");
const Company = require('../../models/misc/Company');
const { logActivity } = require('../../utils/logger');

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
      let lowerFullName = lowerUsername;
      try {
        const User = require('../../models/admin_settings/User');
        const adminUser = await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } });
        if (adminUser && adminUser.fullName) {
          lowerFullName = adminUser.fullName.toLowerCase();
        }
      } catch (e) { console.error(e); }

      query.$or = [
        { forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
        { added_by: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
      ];
      if (lowerFullName !== lowerUsername) {
        query.$or.push({ forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
        query.$or.push({ added_by: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
      }
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
    if (status) {
      const statuses = status.split(',').map(s => new RegExp(`^${escapeRegex(s.trim())}$`, 'i'));
      query.companyStatus = { $in: statuses };
    }
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

    if (req.body.contacts) {
      try {
        const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
        const exhibitor = await ExhibitorRegistration.findOne({ clientId: req.params.id });
        if (exhibitor) {
          const payload = { contact1: null, contact2: null };
          const mapContact = (c) => c ? {
            title: c.title,
            firstName: c.firstName,
            lastName: c.surname,
            email: c.email,
            designation: c.designation,
            mobile: c.mobile,
            alternateNo: c.alternate,
            photo: c.photo
          } : null;

          if (updated.contacts[0]) payload.contact1 = mapContact(updated.contacts[0]);
          if (updated.contacts[1]) payload.contact2 = mapContact(updated.contacts[1]);
          await ExhibitorRegistration.updateOne({ _id: exhibitor._id }, { $set: payload });
        }
      } catch (err) {
        console.error("Failed to sync contacts to ExhibitorRegistration", err);
      }
    }

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

const uploadCompanies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file required",
      });
    }

    // Read uploaded excel file
    const workbook = XLSX.readFile(req.file.path);

    const sheetName = workbook.SheetNames[0];

    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      {
        defval: "",
      }
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    const companyMap = new Map();

    // Group same companies from excel
    for (const row of rows) {
      const companyName = String(
        row.companyName || ""
      ).trim();

      if (!companyName) continue;

      const key = companyName.toLowerCase();

      const contact = {
        title: row.contactTitle || "",
        firstName: row.contactFirstName || "",
        surname: row.contactSurname || "",
        designation: row.contactDesignation || "",
        email: String(
          row.contactEmail || ""
        ).toLowerCase(),
        mobile: String(
          row.contactMobile || ""
        ).trim(),
        alternate: String(
          row.contactAlternate || ""
        ).trim(),
      };

      if (!companyMap.has(key)) {
        companyMap.set(key, {
          companyName,
          category: row.category || "",
          businessNature: row.businessNature || "",
          address: row.address || "",
          country: row.country || "",
          state: row.state || "",
          city: row.city || "",
          clientType: row.clientType || "",
          pincode: row.pincode || "",
          website: row.website || "",
          landline: row.landline || "",
          email: row.email || "",
          dataSource: row.dataSource || "",
          eventName: row.eventName || "",
          reminder: row.reminder || null,
          companyStatus:
            row.companyStatus || "New Lead",
          added_by: row.added_by || "",
          udyamNumber:
            row.udyamNumber || "",
          gstNumber: row.gstNumber || "",
          updated_by: null,
          forwardTo: "",
          contacts: [],
        });
      }

      const company = companyMap.get(key);

      const contactExists =
        company.contacts.some(
          (c) =>
            (contact.email &&
              c.email === contact.email) ||
            (contact.mobile &&
              c.mobile === contact.mobile)
        );

      if (!contactExists) {
        company.contacts.push(contact);
      }
    }

    const operations = [];

    for (const company of companyMap.values()) {
      operations.push({
        updateOne: {
          filter: {
            companyName: company.companyName,
          },
          update: {
            $setOnInsert: {
              companyName:
                company.companyName,
              category: company.category,
              businessNature:
                company.businessNature,
              address: company.address,
              country: company.country,
              state: company.state,
              city: company.city,
              clientType:
                company.clientType,
              pincode: company.pincode,
              website: company.website,
              landline: company.landline,
              email: company.email,
              dataSource:
                company.dataSource,
              eventName:
                company.eventName,
              reminder:
                company.reminder,
              companyStatus:
                company.companyStatus,
              added_by:
                company.added_by,
              udyamNumber:
                company.udyamNumber,
              gstNumber:
                company.gstNumber,
              forwardTo:
                company.forwardTo,
            },

            $addToSet: {
              contacts: {
                $each: company.contacts,
              },
            },
          },
          upsert: true,
        },
      });
    }

    let result = {
      upsertedCount: 0,
      modifiedCount: 0,
    };

    if (operations.length) {
      result = await Company.bulkWrite(
        operations,
        {
          ordered: false,
        }
      );
    }

    // Delete uploaded file
    if (
      req.file &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      success: true,
      excelRows: rows.length,
      uniqueCompanies:
        companyMap.size,
      inserted:
        result.upsertedCount || 0,
      updated:
        result.modifiedCount || 0,
      message:
        "Companies imported successfully",
    });
  } catch (error) {
    console.error(error);

    // Delete uploaded file if error
    if (
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➤ Get Achievement Revenue for Dashboard
const getAchievementRevenue = async (req, res) => {
  try {
    const { username, period } = req.query;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const lowerUsername = username.toLowerCase();

    let lowerFullName = lowerUsername;
    try {
      const User = require('../../models/admin_settings/User');
      const adminUser = await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } });
      if (adminUser && adminUser.fullName) {
        lowerFullName = adminUser.fullName.toLowerCase();
      }
    } catch (e) { console.error(e); }

    const orConditions = [
      { forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
      { added_by: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } }
    ];
    if (lowerFullName !== lowerUsername) {
      orConditions.push({ forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
      orConditions.push({ added_by: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
    }

    // 1. Find all CRM companies mapped to this user
    const userCompanies = await Company.find({
      $or: orConditions
    }).select('_id');

    const companyIds = userCompanies.map(c => c._id.toString());

    if (companyIds.length === 0) {
      return res.status(200).json({ success: true, revenue: 0 });
    }

    // 2. Build the query for ExhibitorRegistration
    const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
    const query = {
      clientId: { $in: companyIds },
      status: { $in: ['confirmed', 'paid', 'advance-paid'] }
    };

    // Date filtering
    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (period === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (period === 'this_month' || period === 'current_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      query.createdAt = { $gte: startOfYear, $lte: endOfYear };
    } else if (period === 'previous_month') {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      query.createdAt = { $gte: startOfPrevMonth, $lte: endOfPrevMonth };
    }

    // 3. Find converted registrations and calculate total revenue
    const convertedRegistrations = await ExhibitorRegistration.find(query).select('financeBreakdown participation amountPaid');

    let totalRevenue = 0;
    convertedRegistrations.forEach(reg => {
      const revenue = reg.amountPaid || reg.financeBreakdown?.subtotal || reg.participation?.total || 0;
      totalRevenue += revenue;
    });

    res.status(200).json({ success: true, revenue: totalRevenue, convertedCount: convertedRegistrations.length });
  } catch (err) {
    console.error("Error in getAchievementRevenue:", err);
    res.status(500).json({ success: false, message: "Error calculating revenue" });
  }
};

// ➤ Get Sales Leaderboard
const getSalesLeaderboard = async (req, res) => {
  try {
    const { period } = req.query;

    // 1. Fetch all admins
    const User = require('../../models/admin_settings/User');
    const admins = await User.find({ status: 'Active' }).select('username fullName profileImage');

    // 2. Fetch all CRM companies to map them to admins
    const allCompanies = await Company.find({}).select('_id forwardTo added_by');

    // 3. Build query for ExhibitorRegistration
    const ExhibitorRegistration = require('../../models/exhibitor_seller/ExhibitorRegistration');
    const query = { status: { $in: ['confirmed', 'paid', 'advance-paid'] } };

    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (period === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (period === 'this_month' || period === 'current_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      query.createdAt = { $gte: startOfYear, $lte: endOfYear };
    } else if (period === 'previous_month') {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      query.createdAt = { $gte: startOfPrevMonth, $lte: endOfPrevMonth };
    }

    const allConverted = await ExhibitorRegistration.find(query).select('clientId financeBreakdown participation amountPaid');

    const leaderboard = admins.map(admin => {
      const u = admin.username.toLowerCase();
      const f = admin.fullName ? admin.fullName.toLowerCase() : u;
      // Find companies belonging to this admin
      const adminCompanyIds = allCompanies
        .filter(c =>
          (c.forwardTo && (c.forwardTo.toLowerCase() === u || c.forwardTo.toLowerCase() === f)) ||
          (c.added_by && (c.added_by.toLowerCase() === u || c.added_by.toLowerCase() === f))
        )
        .map(c => c._id.toString());

      const adminRegs = allConverted.filter(reg => reg.clientId && adminCompanyIds.includes(reg.clientId));

      let revenue = 0;
      adminRegs.forEach(reg => {
        revenue += reg.amountPaid || reg.financeBreakdown?.subtotal || reg.participation?.total || 0;
      });

      return {
        name: admin.fullName || admin.username,
        username: admin.username,
        revenue,
        profileImage: admin.profileImage || null
      };
    });

    leaderboard.sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error in getSalesLeaderboard:", err);
    res.status(500).json({ success: false, message: "Error fetching leaderboard" });
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
  uploadCompanies,
  getAchievementRevenue,
  getSalesLeaderboard,
};
