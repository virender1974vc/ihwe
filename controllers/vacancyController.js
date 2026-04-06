const Vacancy = require("../models/Vacancy");
const { logActivity } = require("../utils/logger");

// ➤ Get all vacancies with pagination & search
exports.getVacancies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (status !== "all") {
      query.status = status;
    }

    const total = await Vacancy.countDocuments(query);
    const activeCount = await Vacancy.countDocuments({ status: "active" });
    const inactiveCount = await Vacancy.countDocuments({ status: "inactive" });

    const vacancies = await Vacancy.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: vacancies,
      stats: {
        total,
        active: activeCount,
        inactive: inactiveCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Create
exports.createVacancy = async (req, res) => {
  try {
    const vacancy = new Vacancy(req.body);
    await vacancy.save();
    await logActivity(req, 'Created', 'Vacancies', `Added new vacancy: ${req.body.title}`);
    res.json({ success: true, data: vacancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Update
exports.updateVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vacancy)
      return res.status(404).json({ success: false, message: "Not found" });
    await logActivity(req, 'Updated', 'Vacancies', `Updated vacancy: ${req.body.title || 'ID: ' + req.params.id}`);
    res.json({ success: true, data: vacancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Patch Status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    await logActivity(req, 'Updated', 'Vacancies', `Changed vacancy ID: ${req.params.id} status to ${status}`);
    res.json({ success: true, data: vacancy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Delete
exports.deleteVacancy = async (req, res) => {
  try {
    await Vacancy.findByIdAndDelete(req.params.id);
    await logActivity(req, 'Deleted', 'Vacancies', `Deleted vacancy ID: ${req.params.id}`);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Bulk Delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await Vacancy.deleteMany({ _id: { $in: ids } });
    await logActivity(req, 'Deleted', 'Vacancies', `Bulk deleted ${result.deletedCount} vacancies`);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
