const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const statusOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    user: {
      type: Number,
      default: 1,
    },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    status_code: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    display_order: {
      type: Number,
      required: true,
      default: 1,
    },
    color: {
      type: String,
      default: "#2563eb",
    },
    applicable_for: {
      type: [String],
      default: ["All"],
    },
    added: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "added", updatedAt: "updated" },
  },
);

module.exports = secondaryDB.model("StatusOption", statusOptionSchema);
