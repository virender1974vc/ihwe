const GroupVisitor = require("../../models/visitor/GroupVisitorModel");
const emailService = require("../../utils/emailService");
const { generateRegistrationId } = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");
const { normalizeVisitorMultiSelectFields } = require("../../utils/visitorSelectionNormalizer");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate individual registration IDs for each group member.
 * Format: NGT/IHWE/GRP/<groupSeq>-M<memberIndex>
 */
const assignMemberIds = async (persons, groupId) => {
    return persons.map((p, i) => ({
        ...p,
        registrationId: `${groupId}-M${String(i + 1).padStart(2, "0")}`,
    }));
};

// ─── Create Group Registration ───────────────────────────────────────────────
const createGroupVisitor = async (req, res) => {
    try {
        const { persons, ...rest } = req.body;

        // Validate persons count
        if (!Array.isArray(persons) || persons.length < 5 || persons.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Group registration requires between 5 and 10 members.",
            });
        }

        // Validate required fields on each person
        for (let i = 0; i < persons.length; i++) {
            const p = persons[i];
            if (!p.firstName || !p.lastName || !p.email || !p.mobileNo) {
                return res.status(400).json({
                    success: false,
                    message: `Person ${i + 1} is missing required fields (firstName, lastName, email, mobileNo).`,
                });
            }
        }

        const normalizedBody = normalizeVisitorMultiSelectFields(rest);

        // Generate group registration ID
        const groupRegistrationId = await generateRegistrationId("group");

        // Assign individual IDs to each member
        const membersWithIds = await assignMemberIds(persons, groupRegistrationId);

        const primary = persons[0];

        const group = new GroupVisitor({
            ...normalizedBody,
            groupRegistrationId,
            persons: membersWithIds,
            primaryFirstName: primary.firstName,
            primaryLastName: primary.lastName,
            primaryEmail: primary.email,
            primaryMobile: primary.mobileNo,
        });

        const saved = await group.save();

        // ── Notifications ──────────────────────────────────────────────────────

        // Send confirmation to each member
        saved.persons.forEach((member) => {
            const emailData = {
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                mobileNo: member.mobileNo,
                mobile: member.mobileNo,
                visitorType: "Group / Corporate Visitor",
                purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ["Business Networking"],
                areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ["Healthcare"],
                city: saved.city || "N/A",
                country: saved.country || "India",
                registrationId: member.registrationId,
                b2bMeeting: saved.b2bMeeting,
                designation: member.designation || "N/A",
                companyName: saved.companyName || "N/A",
                groupRegistrationId: saved.groupRegistrationId,
                totalMembers: saved.persons.length,
            };

            emailService
                .sendVisitorConfirmationOnly(emailData, "corporate-visitor")
                .catch((err) =>
                    console.error(`Error sending confirmation to ${member.email}:`, err)
                );
        });

        // Admin notification (primary contact details)
        const adminEmailData = {
            firstName: primary.firstName,
            lastName: primary.lastName,
            email: primary.email,
            mobileNo: primary.mobileNo,
            mobile: primary.mobileNo,
            visitorType: "Group / Corporate Visitor",
            purposeOfVisit: saved.purposeOfVisit,
            areaOfInterest: saved.areaOfInterest,
            city: saved.city || "N/A",
            country: saved.country || "India",
            registrationId: saved.groupRegistrationId,
            b2bMeeting: saved.b2bMeeting,
            designation: primary.designation || "N/A",
            companyName: saved.companyName || "N/A",
            groupRegistrationId: saved.groupRegistrationId,
            totalMembers: saved.persons.length,
        };

        emailService
            .sendDetailedVisitorNotification(adminEmailData, "admin")
            .catch((err) =>
                console.error("Error sending admin group notification:", err)
            );

        if (saved.b2bMeeting && saved.b2bMeeting.toLowerCase() === "yes") {
            emailService
                .sendDetailedVisitorNotification(adminEmailData, "b2b")
                .catch((err) =>
                    console.error("Error sending B2B coordinator notification:", err)
                );
        }

        await logActivity(
            req,
            "Created",
            "Visitor Registrations",
            `Added new group registration: ${saved.groupRegistrationId} — ${saved.companyName} (${saved.persons.length} members)`
        );

        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        console.error("Group visitor creation error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Get All Group Registrations ─────────────────────────────────────────────
const getAllGroupVisitors = async (req, res) => {
    try {
        const groups = await GroupVisitor.find().sort({ createdAt: -1 });
        res.json({ success: true, data: groups });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Get Single Group by ID ───────────────────────────────────────────────────
const getGroupVisitorById = async (req, res) => {
    try {
        const group = await GroupVisitor.findById(req.params.id);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        res.json({ success: true, data: group });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Update Group ─────────────────────────────────────────────────────────────
const updateGroupVisitor = async (req, res) => {
    try {
        const normalizedBody = normalizeVisitorMultiSelectFields(req.body);
        const updated = await GroupVisitor.findByIdAndUpdate(
            req.params.id,
            normalizedBody,
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Group not found" });

        await logActivity(req, "Updated", "Visitor Registrations", `Updated group visitor ID: ${req.params.id}`);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Delete Group ─────────────────────────────────────────────────────────────
const deleteGroupVisitor = async (req, res) => {
    try {
        const deleted = await GroupVisitor.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Group not found" });

        await logActivity(req, "Deleted", "Visitor Registrations", `Deleted group visitor ID: ${req.params.id}`);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createGroupVisitor,
    getAllGroupVisitors,
    getGroupVisitorById,
    updateGroupVisitor,
    deleteGroupVisitor,
};
