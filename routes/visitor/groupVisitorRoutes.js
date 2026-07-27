const express = require("express");
const {
    createGroupVisitor,
    getAllGroupVisitors,
    getGroupVisitorById,
    updateGroupVisitor,
    deleteGroupVisitor,
} = require("../../controllers/visitor/groupVisitorController");

const GroupVisitor = require("../../models/visitor/GroupVisitorModel");

const router = express.Router();

// Public: lookup by groupRegistrationId (for QR scan)
router.get("/scan/:groupRegistrationId", async (req, res) => {
    try {
        const group = await GroupVisitor.findOne({
            groupRegistrationId: req.params.groupRegistrationId,
        }).select("-__v");
        if (!group)
            return res.status(404).json({ success: false, message: "Group not found" });
        res.json({ success: true, data: group });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Public: lookup member by individual registrationId
router.get("/member/:registrationId", async (req, res) => {
    try {
        const group = await GroupVisitor.findOne({
            "persons.registrationId": req.params.registrationId,
        }).select("-__v");
        if (!group)
            return res.status(404).json({ success: false, message: "Member not found" });

        const member = group.persons.find(
            (p) => p.registrationId === req.params.registrationId
        );
        res.json({ success: true, data: { group, member } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/", getAllGroupVisitors);
router.get("/:id", getGroupVisitorById);
router.post("/", createGroupVisitor);
router.put("/:id", updateGroupVisitor);
router.delete("/:id", deleteGroupVisitor);

module.exports = router;
