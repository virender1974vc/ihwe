const PrimaryProductInterest = require("../../models/add_by_admin/PrimaryProductInterest");

// Get All
exports.getAllPrimaryProductInterests = async (req, res) => {
    try {
        const primaryProductInterests = await PrimaryProductInterest.find();
        res.status(200).json({ success: true, data: primaryProductInterests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get By Id
exports.getPrimaryProductInterestById = async (req, res) => {
    try {
        const primaryProductInterest = await PrimaryProductInterest.findById(req.params.id);
        if (!primaryProductInterest) {
            return res.status(404).json({ success: false, message: "Primary product interest not found" });
        }
        res.status(200).json({ success: true, data: primaryProductInterest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Create
exports.createPrimaryProductInterest = async (req, res) => {
    try {
        const { nature_id, primary_product_interest, status, added_by } = req.body;
        const primaryProductInterest = new PrimaryProductInterest({
            nature_id,
            primary_product_interest,
            status,
            added_by,
        });
        await primaryProductInterest.save();
        res.status(201).json({ success: true, data: primaryProductInterest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Update
exports.updatePrimaryProductInterest = async (req, res) => {
    try {
        const { nature_id, primary_product_interest, status, added_by } = req.body;
        const primaryProductInterest = await PrimaryProductInterest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!primaryProductInterest) {
            return res.status(404).json({ success: false, message: "Primary product interest not found" });
        }
        res.status(200).json({ success: true, data: primaryProductInterest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Delete
exports.deletePrimaryProductInterest = async (req, res) => {
    try {
        const primaryProductInterest = await PrimaryProductInterest.findByIdAndDelete(req.params.id);
        if (!primaryProductInterest) {
            return res.status(404).json({ success: false, message: "Primary product interest not found" });
        }
        res.status(200).json({ success: true, data: primaryProductInterest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
