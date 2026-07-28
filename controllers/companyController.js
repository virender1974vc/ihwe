const XLSX = require("xlsx");
const fs = require("fs");
const Company = require("../models/Company.js");
const { logActivity } = require("../utils/logger");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Safely AND together multiple independent $or blocks on the same query
// (e.g. event scope, authorization, search) without one overwriting another.
const mergeOrCondition = (query, orArray) => {
  if (!orArray || orArray.length === 0) return;
  const block = { $or: orArray };
  if (query.$and) {
    query.$and.push(block);
  } else if (query.$or) {
    query.$and = [{ $or: query.$or }, block];
    delete query.$or;
  } else {
    query.$or = orArray;
  }
};

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
    const { search, status, source, industry, page, limit, countOnly, idsOnly, dashboard, username, role, startDate, endDate, forwardTo, eventId, state, city } = req.query;

    let query = {};

    // Scope to a single event when one is selected (multi-event support).
    // A company matches if it was created for this event (legacy `eventId`)
    // OR has been assigned to it via the newer `events` set.
    // No eventId means "all events" — this is what Master Data uses to show
    // every company regardless of event.
    if (eventId) {
      mergeOrCondition(query, [{ eventId }, { events: eventId }]);
    }

    // Authorization filter
    const lowerUsername = username ? username.toLowerCase() : null;
    const cleanRole = role ? role.toLowerCase().replace(/[^a-z]/g, '') : '';
    const isSuperAdmin = cleanRole === 'superadmin';

    if (lowerUsername && !isSuperAdmin) {
      let lowerFullName = lowerUsername;
      try {
        const User = require('../models/User');
        const adminUser = await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } });
        if (adminUser && adminUser.fullName) {
          lowerFullName = adminUser.fullName.toLowerCase();
        }
      } catch (e) { console.error(e); }

      const authOr = [
        { forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
        { added_by: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
      ];
      if (lowerFullName !== lowerUsername) {
        authOr.push({ forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
        authOr.push({ added_by: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
      }
      mergeOrCondition(query, authOr);
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
    // state/city come from the CrmState/CrmCity reference lists (state_id /
    // city_id backed dropdowns) — matched by name since Company itself still
    // stores free text, so this stays exact (anchored, case-insensitive).
    if (state) query.state = { $regex: new RegExp(`^${escapeRegex(state)}$`, 'i') };
    if (city) query.city = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };

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

      mergeOrCondition(query, searchOr);
    }

    // Just the matching ids — powers "select all N leads matching filters"
    // in Master Data's bulk-assign toolbar, without shipping full documents.
    if (idsOnly === 'true') {
      const rows = await Company.find(query).select('_id').limit(5000).lean();
      return res.status(200).json({ ids: rows.map((r) => r._id) });
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

// ➤ Lightweight, accurate stats summary — total + per-status counts via
// aggregation, instead of the "dashboard=true" raw-doc fetch which is capped
// at 3000 rows and goes wrong once the collection grows past that (Master
// Data showed a stale/capped "Total Leads" count once the DB passed 30k+ rows).
const getCompanyStatsSummary = async (req, res) => {
  try {
    const { eventId, username, role, status } = req.query;
    let query = {};

    if (eventId) {
      mergeOrCondition(query, [{ eventId }, { events: eventId }]);
    }

    // Comma-separated, matched as a SUBSTRING of companyStatus (not anchored)
    // to mirror the messy real-world status text (e.g. "On Hold", "Not
    // Interested - lost deal") the way each list page's own client-side
    // `status.includes(...)` categorization already does.
    if (status) {
      const parts = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        mergeOrCondition(query, parts.map((p) => ({ companyStatus: { $regex: new RegExp(escapeRegex(p), 'i') } })));
      }
    }

    const lowerUsername = username ? username.toLowerCase() : null;
    const cleanRole = role ? role.toLowerCase().replace(/[^a-z]/g, '') : '';
    const isSuperAdmin = cleanRole === 'superadmin';

    if (lowerUsername && !isSuperAdmin) {
      let lowerFullName = lowerUsername;
      try {
        const User = require('../models/User');
        const adminUser = await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } });
        if (adminUser && adminUser.fullName) {
          lowerFullName = adminUser.fullName.toLowerCase();
        }
      } catch (e) { console.error(e); }

      const authOr = [
        { forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
        { added_by: { $regex: new RegExp(`^${escapeRegex(lowerUsername)}$`, 'i') } },
      ];
      if (lowerFullName !== lowerUsername) {
        authOr.push({ forwardTo: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
        authOr.push({ added_by: { $regex: new RegExp(`^${escapeRegex(lowerFullName)}$`, 'i') } });
      }
      mergeOrCondition(query, authOr);
    }

    const [total, statusAgg] = await Promise.all([
      Company.countDocuments(query),
      Company.aggregate([{ $match: query }, { $group: { _id: "$companyStatus", count: { $sum: 1 } } }]),
    ]);

    const statusCounts = {};
    statusAgg.forEach((s) => { statusCounts[s._id || "New Lead"] = s.count; });

    res.status(200).json({ success: true, total, statusCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching stats summary", error: error.message });
  }
};

// ➤ Get single company
const getCompanyById = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    if (!company) {
      const ExhibitorRegistration = require('../models/ExhibitorRegistration');
      company = await ExhibitorRegistration.findById(req.params.id);
      if (company) {
        return res.status(200).json({ ...company.toObject(), _source: 'exhibitorRegistration' });
      }
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching company",
      error: error.message,
    });
  }
};

// ➤ Re-engage a company from master data for a NEW event.
// Instead of the admin re-typing GST/PAN/address/contacts from scratch, this copies
// the profile fields from any of that company's past records into a fresh lead row
// scoped to the target event, with the sales pipeline reset to "New Lead".
// Idempotent: if a row for this company already exists in the target event, that's
// returned instead of creating a duplicate.
const PROFILE_FIELDS = [
  'companyName', 'category', 'businessNature', 'address', 'country', 'state', 'city',
  'clientType', 'pincode', 'website', 'landline', 'email', 'udyamNumber', 'gstNumber',
  'panNo', 'exhibitorCategory', 'companyLogo', 'companyDescription', 'contacts',
];

const addCompanyToEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }

    const source = await Company.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Already has a lead in this event (by GST/PAN/email — the same identity signals
    // used elsewhere for dedup)? Reuse it instead of creating a duplicate.
    const identityOr = [];
    if (source.gstNumber) identityOr.push({ gstNumber: source.gstNumber });
    if (source.panNo) identityOr.push({ panNo: source.panNo });
    if (source.email) identityOr.push({ email: { $regex: new RegExp(`^${escapeRegex(source.email)}$`, 'i') } });
    const existing = identityOr.length
      ? await Company.findOne({ eventId, $or: identityOr })
      : null;
    if (existing) {
      return res.status(200).json({ success: true, data: existing, reused: true });
    }

    const profileData = {};
    PROFILE_FIELDS.forEach((field) => {
      if (source[field] !== undefined) profileData[field] = source[field];
    });

    const newCompany = new Company({
      ...profileData,
      eventId,
      companyStatus: 'New Lead',
      dataSource: 'Master Data Re-engagement',
      forwardTo: undefined,
      followUpDate: undefined,
      reminder: undefined,
      exhibitorRegistrationId: null,
    });
    await newCompany.save();

    await logActivity(req, 'Created', 'Client Data', `Re-engaged "${source.companyName}" for a new event from master data`);

    res.status(201).json({ success: true, data: newCompany, reused: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding company to event', error: error.message });
  }
};

// For each eventId, sets eventAssignments.forwardTo on companies that already
// have an entry for that event, and pushes a fresh entry for companies that
// don't — across `companyIds`. Scoped strictly to `eventIds`, so assigning a
// person for Organic Expo 2027 never touches an existing IHWE Expo 2026 entry.
const upsertEventAssignments = async (companyIds, eventIds, forwardTo) => {
  for (const eventId of eventIds) {
    await Company.updateMany(
      { _id: { $in: companyIds }, "eventAssignments.eventId": eventId },
      { $set: { "eventAssignments.$.forwardTo": forwardTo } },
    );
    await Company.updateMany(
      { _id: { $in: companyIds }, "eventAssignments.eventId": { $ne: eventId } },
      { $push: { eventAssignments: { eventId, forwardTo } } },
    );
  }
};

// ➤ Lookup Company or Exhibitor Registration by ID (to avoid frontend 404 fallback errors)
// ➤ Assign one or more events to a single company. Adds to the `events` set
// (doesn't remove existing assignments) so a company already tagged to
// IHWE 2026 can also be tagged to Organic 2027 without losing the first one.
// An optional `forwardTo` is scoped to just these `eventIds` via
// `eventAssignments` — it never overwrites the person assigned to a
// different, already-assigned event on the same company.
const assignEventsToCompany = async (req, res) => {
  try {
    const { eventIds, forwardTo } = req.body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ success: false, message: "eventIds (non-empty array) is required" });
    }

    await Company.findByIdAndUpdate(req.params.id, { $addToSet: { events: { $each: eventIds } } });

    if (typeof forwardTo === "string" && forwardTo.trim().length > 0) {
      await upsertEventAssignments([req.params.id], eventIds, forwardTo.trim());
    }

    const updated = await Company.findById(req.params.id);
    if (!updated) return res.status(404).json({ success: false, message: "Company not found" });

    await logActivity(req, "Updated", "Client Data", `Assigned ${eventIds.length} event(s) to "${updated.companyName}"`);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error assigning events", error: error.message });
  }
};

// ➤ Bulk-assign events and/or a handling person ("forwardTo") to many
// companies at once — used by Master Data's row-selection toolbar.
// When both an event and a person are given together, the person is scoped
// to that event only (via `eventAssignments`) — it does NOT overwrite who's
// assigned on any other event the company already belongs to. `forwardTo`
// with no `eventIds` falls back to the old flat, event-agnostic reassignment.
const bulkAssignCompanies = async (req, res) => {
  try {
    const { companyIds, eventIds, forwardTo } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ success: false, message: "companyIds (non-empty array) is required" });
    }

    const hasEvents = Array.isArray(eventIds) && eventIds.length > 0;
    const hasForwardTo = typeof forwardTo === "string" && forwardTo.trim().length > 0;
    if (!hasEvents && !hasForwardTo) {
      return res.status(400).json({ success: false, message: "Provide eventIds and/or forwardTo to assign" });
    }

    let result = { matchedCount: companyIds.length, modifiedCount: 0 };

    if (hasEvents) {
      result = await Company.updateMany(
        { _id: { $in: companyIds } },
        { $addToSet: { events: { $each: eventIds } } },
      );
    }

    if (hasForwardTo && hasEvents) {
      await upsertEventAssignments(companyIds, eventIds, forwardTo.trim());
    } else if (hasForwardTo) {
      result = await Company.updateMany({ _id: { $in: companyIds } }, { $set: { forwardTo: forwardTo.trim() } });
    }

    await logActivity(
      req,
      "Updated",
      "Client Data",
      `Bulk-assigned ${companyIds.length} compan${companyIds.length === 1 ? "y" : "ies"}` +
        (hasEvents ? ` to ${eventIds.length} event(s)` : "") +
        (hasForwardTo ? ` and forwarded to "${forwardTo.trim()}"` : ""),
    );

    res.status(200).json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error bulk-assigning companies", error: error.message });
  }
};

const lookupCompanyOrExhibitor = async (req, res) => {
  try {
    let client = await Company.findById(req.params.id);
    if (client) {
      return res.status(200).json({ ...client.toObject(), _source: 'company' });
    }

    const ExhibitorRegistration = require('../models/ExhibitorRegistration');
    client = await ExhibitorRegistration.findById(req.params.id);
    if (client) {
      return res.status(200).json({ ...client.toObject(), _source: 'exhibitor' });
    }

    return res.status(404).json({ message: "Client not found" });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching client",
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
        const ExhibitorRegistration = require('../models/ExhibitorRegistration');
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
            photoUrl: c.photo
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
      const User = require('../models/User');
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
    const ExhibitorRegistration = require('../models/ExhibitorRegistration');
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
    const User = require('../models/User');
    const admins = await User.find({ status: 'Active' }).select('username fullName profileImage');

    // 2. Build query for ExhibitorRegistration
    const ExhibitorRegistration = require('../models/ExhibitorRegistration');
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

    // 3. Fetch converted registrations first
    const allConverted = await ExhibitorRegistration.find(query).select('clientId financeBreakdown participation amountPaid');
    
    // 4. Extract unique clientIds and fetch ONLY those companies to map them to admins
    const uniqueClientIds = [...new Set(allConverted.map(reg => reg.clientId).filter(Boolean))];
    const relevantCompanies = await Company.find({ _id: { $in: uniqueClientIds } }).select('_id forwardTo added_by');

    const leaderboard = admins.map(admin => {
      const u = admin.username.toLowerCase();
      const f = admin.fullName ? admin.fullName.toLowerCase() : u;
      
      // Find companies belonging to this admin
      const adminCompanyIds = relevantCompanies
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
  getCompanyStatsSummary,
  getCompanyById,
  addCompanyToEvent,
  assignEventsToCompany,
  bulkAssignCompanies,
  lookupCompanyOrExhibitor,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  uploadContactPhoto,
  uploadCompanies,
  getAchievementRevenue,
  getSalesLeaderboard,
};
