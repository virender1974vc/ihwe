const Career = require("../models/Career");

// 📤 Fetch All Applications
exports.getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all" && status) {
      query.status = status;
    }

    const totalCount = await Career.countDocuments(query);
    const stats = {
      total: totalCount,
      new: await Career.countDocuments({ status: "new" }),
      reviewed: await Career.countDocuments({ status: "reviewed" }),
      shortlisted: await Career.countDocuments({ status: "shortlisted" }),
      rejected: await Career.countDocuments({ status: "rejected" }),
      contacted: await Career.countDocuments({ status: "contacted" }),
    };

    const applicaitons = await Career.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: applicaitons, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📤 Create New Application (Post from website)
exports.createApplication = async (req, res) => {
  try {
    const career = new Career(req.body);
    await career.save();
    res.json({ success: true, data: career });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📤 Update Status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, data: career });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📤 Delete
exports.deleteApplication = async (req, res) => {
  try {
    await Career.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📤 Bulk Delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await Career.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
