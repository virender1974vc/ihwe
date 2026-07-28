const StatusOption = require("../../models/add_by_admin/StatusOption");
const { resequenceDisplayOrder } = require("../../utils/displayOrder");

// ➤ Create new status option
const createStatusOption = async (req, res) => {
  try {
    const newStatus = new StatusOption(req.body);
    await newStatus.save();
    await resequenceDisplayOrder(
      StatusOption,
      newStatus._id,
      req.body.display_order,
    );
    const savedStatus = await StatusOption.findById(newStatus._id);

    res.status(201).json({
      message: "Status option created successfully",
      data: savedStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating status option",
      error: error.message,
    });
  }
};

// ➤ Get all status options
const getStatusOptions = async (req, res) => {
  try {
    const statuses = await StatusOption.find().sort({ display_order: 1, name: 1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching status options",
      error: error.message,
    });
  }
};

// ➤ Get one by ID
const getStatusOptionById = async (req, res) => {
  try {
    const status = await StatusOption.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Status option not found",
      });
    }

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching status option",
      error: error.message,
    });
  }
};

// ➤ Update status option
const updateStatusOption = async (req, res) => {
  try {
    const updated = await StatusOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' },
    );

    if (!updated) {
      return res.status(404).json({
        message: "Status option not found",
      });
    }

    if (req.body.display_order !== undefined) {
      await resequenceDisplayOrder(
        StatusOption,
        updated._id,
        req.body.display_order,
      );
    }

    const savedStatus = await StatusOption.findById(updated._id);

    res.status(200).json({
      message: "Status option updated",
      data: savedStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating status option",
      error: error.message,
    });
  }
};

// ➤ Delete status option
const deleteStatusOption = async (req, res) => {
  try {
    const deleted = await StatusOption.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Status option not found",
      });
    }

    res.status(200).json({
      message: "Status option deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting status option",
      error: error.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  createStatusOption,
  getStatusOptions,
  getStatusOptionById,
  updateStatusOption,
  deleteStatusOption,
};
