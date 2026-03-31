const ContactEnquiry = require("../models/ContactEnquiry");

const getStats = async () => {
    return {
        total: await ContactEnquiry.countDocuments(),
        new: await ContactEnquiry.countDocuments({ status: "new" }),
        pending: await ContactEnquiry.countDocuments({ status: "pending" }),
        contacted: await ContactEnquiry.countDocuments({ status: "contacted" }),
        resolved: await ContactEnquiry.countDocuments({ status: "resolved" }),
    };
};

const getAllContacts = async (req, res) => {
    try {
        const { page = 1, limit = 25, search = "", status = "all", dateFrom, dateTo } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { service: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        if (status !== "all") query.status = status;

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;
        const contacts = await ContactEnquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await ContactEnquiry.countDocuments(query);
        const stats = await getStats();

        res.json({ success: true, data: contacts, stats, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteContact = async (req, res) => {
    try {
        await ContactEnquiry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Contact deleted" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const bulkDeleteContacts = async (req, res) => {
    try {
        await ContactEnquiry.deleteMany({ _id: { $in: req.body.ids } });
        res.json({ success: true, message: "Contacts deleted" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateStatus = async (req, res) => {
    try {
        await ContactEnquiry.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true, message: "Status updated" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const bulkUpdateStatus = async (req, res) => {
    try {
        await ContactEnquiry.updateMany({ _id: { $in: req.body.ids } }, { status: req.body.status });
        res.json({ success: true, message: "Statuses updated" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllContacts, deleteContact, bulkDeleteContacts, updateStatus, bulkUpdateStatus };
