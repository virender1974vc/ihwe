const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");

const GroupMemberSchema = new mongoose.Schema(
    {
        registrationId: { type: String },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        gender: { type: String },
        designation: { type: String },
        email: { type: String, required: true, trim: true, lowercase: true },
        mobileNo: { type: String, required: true, trim: true },
    },
    { _id: true }
);

const GroupVisitorSchema = new mongoose.Schema(
    {
        // Group registration ID (for the whole group)
        groupRegistrationId: { type: String, unique: true },

        // Company / Industry
        registrationFor: { type: String, required: true },
        companyName: { type: String, required: true, trim: true },
        companyWebsite: { type: String, trim: true },
        industrySector: { type: String },
        companySize: { type: String },
        country: { type: String, default: "India" },
        state: { type: String },
        city: { type: String },
        companyPincode: { type: String },

        // Preferences
        b2bMeeting: { type: String, default: "no" },
        whatsappUpdates: { type: String, default: "yes" },
        specificRequirement: { type: String },
        subscribe: { type: Boolean, default: false },
        purposeOfVisit: [{ type: String }],
        areaOfInterest: [{ type: String }],

        // Members (min 5, max 10)
        persons: {
            type: [GroupMemberSchema],
            validate: {
                validator: (arr) => arr.length >= 5 && arr.length <= 10,
                message: "Group must have between 5 and 10 members.",
            },
        },

        // Primary contact (person 0) — denormalised for quick lookup
        primaryFirstName: { type: String },
        primaryLastName: { type: String },
        primaryEmail: { type: String },
        primaryMobile: { type: String },

        status: { type: String, default: "New Reg." },
        created_by: { type: String, default: null },
        updated_by: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = secondaryDB.model("GroupVisitor", GroupVisitorSchema);
