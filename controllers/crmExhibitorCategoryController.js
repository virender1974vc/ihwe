const CrmExhibitorCategory = require("../models/CrmExhibitorCategory.js");

// GET all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await CrmExhibitorCategory.find();
    res.json(categories);
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
    res.status(201).json(savedCategory);
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

    const allowedFields = ["cat_id", "cat_name", "cat_status"];
    allowedFields.forEach((key) => {
      if (updates[key] !== undefined) category[key] = updates[key];
    });

    category.cat_updated = new Date();
    const savedCategory = await category.save();
    res.json(savedCategory);
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
