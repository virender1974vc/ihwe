const LeadTypeOfBusiness = require("../../models/add_by_admin/LeadTypeOfBusiness");

const DEFAULT_TYPES = [
  "Pvt. Ltd. Company",
  "Pub. Ltd. Company",
  "Partnership Company",
  "Limited Liability Partnership (LLP)",
  "One Person Company",
  "Sole Proprietorship",
  "Section 8 Company",
  "Others",
];

// Seed defaults if collection is empty
const seedDefaults = async () => {
  const count = await LeadTypeOfBusiness.countDocuments();
  if (count === 0) {
    const docs = DEFAULT_TYPES.map((name, idx) => ({
      name,
      order: idx + 1,
      status: "Active",
      added_by: "System",
    }));
    await LeadTypeOfBusiness.insertMany(docs);
  }
};

// GET all (active only for dropdown, all for admin)
const getAll = async (req, res) => {
  try {
    await seedDefaults();
    const filter = req.query.activeOnly === "true" ? { status: "Active" } : {};
    const records = await LeadTypeOfBusiness.find(filter).sort({ order: 1, added: 1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching records", error: err.message });
  }
};

// GET by ID
const getById = async (req, res) => {
  try {
    const record = await LeadTypeOfBusiness.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching record", error: err.message });
  }
};

// CREATE
const create = async (req, res) => {
  try {
    const { name, order, status, added_by } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const record = new LeadTypeOfBusiness({ name: name.trim(), order: order || 0, status: status || "Active", added_by: added_by || "admin" });
    const saved = await record.save();
    res.status(201).json({ success: true, data: saved, message: "Created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error creating record", error: err.message });
  }
};

// UPDATE
const update = async (req, res) => {
  try {
    const { name, order, status, updated_by } = req.body;
    const record = await LeadTypeOfBusiness.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Not found" });

    if (name !== undefined) record.name = name.trim();
    if (order !== undefined) record.order = order;
    if (status !== undefined) record.status = status;
    if (updated_by !== undefined) record.updated_by = updated_by;

    const saved = await record.save();
    res.json({ success: true, data: saved, message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating record", error: err.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const record = await LeadTypeOfBusiness.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting record", error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
