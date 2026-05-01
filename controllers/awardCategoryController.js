const AwardCategory = require('../models/AwardCategory');
const { logActivity } = require('../utils/logger');

// GET all (public + admin) — only Active for public
const getAll = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: 'Active' };
    const categories = await AwardCategory.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single
const getById = async (req, res) => {
  try {
    const cat = await AwardCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create
const create = async (req, res) => {
  try {
    const { name, description, status, order } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const cat = new AwardCategory({ name, description, status, order, added_by: req.body.added_by || 'Admin' });
    const saved = await cat.save();
    await logActivity(req, 'Created', 'Award Category', `Created category: ${name}`);
    res.status(201).json({ success: true, message: 'Category created successfully', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update
const update = async (req, res) => {
  try {
    const { name, description, status, order } = req.body;
    const updated = await AwardCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, status, order, updated_by: req.body.updated_by || 'Admin' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
    await logActivity(req, 'Updated', 'Award Category', `Updated category: ${name}`);
    res.json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const deleted = await AwardCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
    await logActivity(req, 'Deleted', 'Award Category', `Deleted category ID: ${req.params.id}`);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
