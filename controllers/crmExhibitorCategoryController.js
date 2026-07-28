const CrmExhibitorCategory = require("../models/CrmExhibitorCategory.js");
const CrmUser = require("../models/CrmUser.js");
const { resequenceDisplayOrder } = require("../utils/displayOrder");

// GET all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await CrmExhibitorCategory.find()
      .sort({ display_order: 1, cat_name: 1 })
      .lean();
    
    // Fetch all users to map username to full name
    const users = await CrmUser.find({}, 'user_name user_fullname').lean();
    const userMap = {};
    users.forEach(u => {
        if (u.user_name) userMap[u.user_name] = u.user_fullname || u.user_name;
    });

    // Map updated_by to full name
    const mappedCategories = categories.map(cat => ({
        ...cat,
        updated_by: userMap[cat.updated_by] || cat.updated_by
    }));

    res.json(mappedCategories);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: err.message });
  }
};

// GET category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await CrmExhibitorCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching category", error: err.message });
  }
};

// CREATE new category
const createCategory = async (req, res) => {
  try {
    const newCategory = new CrmExhibitorCategory(req.body);
    const savedCategory = await newCategory.save();
    await resequenceDisplayOrder(
      CrmExhibitorCategory,
      savedCategory._id,
      req.body.display_order,
    );
    const orderedCategory = await CrmExhibitorCategory.findById(savedCategory._id);
    res.status(201).json(orderedCategory);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating category", error: err.message });
  }
};

// UPDATE category by ID
const updateCategory = async (req, res) => {
  try {
    const updates = req.body || {};
    const category = await CrmExhibitorCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const allowedFields = ["cat_id", "cat_name", "cat_status", "updated_by", "parent_category", "business_nature", "cat_description", "display_order", "applicable_for", "icon_name", "icon_data_url"];
    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) category[key] = updates[key];
    });

    category.cat_updated = new Date();
    const savedCategory = await category.save();
    if (updates.display_order !== undefined) {
      await resequenceDisplayOrder(
        CrmExhibitorCategory,
        savedCategory._id,
        updates.display_order,
      );
    }
    const orderedCategory = await CrmExhibitorCategory.findById(savedCategory._id);
    res.json(orderedCategory);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating category", error: err.message });
  }
};

// DELETE category by ID
const deleteCategory = async (req, res) => {
  try {
    const category = await CrmExhibitorCategory.findByIdAndDelete(
      req.params.id,
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: err.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
