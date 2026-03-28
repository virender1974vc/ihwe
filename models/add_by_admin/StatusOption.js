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
