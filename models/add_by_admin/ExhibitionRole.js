const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const ExhibitionRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    created_by: {
      type: String,
      default: null,
      trim: true,
    },
    deleted_by: {
      type: String,
      default: null,
      trim: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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

module.exports = secondaryDB.model("ExhibitionRole", ExhibitionRoleSchema);
