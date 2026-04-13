const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const PrimaryProductInterestSchema = new mongoose.Schema(
    {
        nature_id: { type: String, required: true },
        primary_product_interest: { type: String, required: true },
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

module.exports = secondaryDB.model("PrimaryProductInterest", PrimaryProductInterestSchema);
