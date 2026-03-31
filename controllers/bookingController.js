const Booking = require("../models/Booking");

// Helper to get stats
const getStats = async () => {
    return {
        total: await Booking.countDocuments(),
        new: await Booking.countDocuments({ status: "new" }),
        pending: await Booking.countDocuments({ status: "pending" }),
        contacted: await Booking.countDocuments({ status: "contacted" }),
        resolved: await Booking.countDocuments({ status: "resolved" }),
    };
};

const getAllBookings = async (req, res) => {
    try {
        const { page = 1, limit = 8, search = "", status = "all", dateFrom, dateTo } = req.query;
        const query = {};

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        // Status
        if (status !== "all") {
            query.status = status;
        }

        // Date range
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;
        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const stats = await getStats();

        res.json({ success: true, data: bookings, stats, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Booking deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bulkDeleteBookings = async (req, res) => {
    try {
        const { ids } = req.body;
        await Booking.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: "Bookings deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await Booking.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true, message: "Status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bulkUpdateBookingStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        await Booking.updateMany({ _id: { $in: ids } }, { status });
        res.json({ success: true, message: "Statuses updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllBookings,
    deleteBooking,
    bulkDeleteBookings,
    updateBookingStatus,
    bulkUpdateBookingStatus,
};
