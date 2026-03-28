const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const CrmExhibitorCategorySchema = new mongoose.Schema(
  {
    cat_id: { type: Number, required: true },
    cat_name: { type: String, required: true },
    cat_status: { type: String, required: true },
    cat_added: { type: Date, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "cat_added", updatedAt: "cat_updated" } },
);

module.exports = secondaryDB.model(
  "CrmExhibitorCategory",
  CrmExhibitorCategorySchema,
);
