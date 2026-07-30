const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmExhibitorCategorySchema = new mongoose.Schema(
  {
    cat_id: { type: Number, required: true },
    cat_name: { type: String, required: true },
    cat_status: { type: String, required: true },
    cat_added: { type: Date },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    parent_category: { type: String, default: null },
    business_nature: { type: String, default: "" },
    cat_description: { type: String },
    display_order: { type: Number },
    applicable_for: { type: [String] },
    icon_name: { type: String },
    icon_data_url: { type: String },
  },
  { timestamps: { createdAt: "cat_added", updatedAt: "cat_updated" } },
);

module.exports = secondaryDB.model(
  "CrmExhibitorCategory",
  CrmExhibitorCategorySchema,
);
