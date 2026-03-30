const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const DataSourceSchema = new mongoose.Schema(
  {
    source_id: { type: Number, required: true },
    source_name: { type: String, required: true },
    source_status: { type: String, default: "active" },
    added: { type: Date },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("DataSource", DataSourceSchema);
