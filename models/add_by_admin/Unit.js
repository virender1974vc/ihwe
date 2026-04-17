const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const UnitSchema = new mongoose.Schema(
    {
        unit: { type: String, required: true },
        status: { type: String, default: "Active" },
        added_by: { type: String, required: true },
        updated_by: {
            type: String,
            default: null,
            trim: true,
        },
    },
    { timestamps: { createdAt: "added", updatedAt: "updated" } },
);

module.exports = secondaryDB.model("Unit", UnitSchema);
