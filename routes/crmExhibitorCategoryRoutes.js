const express = require("express");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/crmExhibitorCategoryController.js");

const router = express.Router();

router.get("/", getAllCategories); // GET all
router.get("/:id", getCategoryById); // GET one
router.post("/", createCategory); // CREATE
router.put("/:id", updateCategory); // UPDATE
router.delete("/:id", deleteCategory); // DELETE

module.exports = router;
