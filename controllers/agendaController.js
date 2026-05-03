const ConferenceAgenda = require("../models/ConferenceAgenda");

// Get all agenda items
exports.getAgendas = async (req, res) => {
  try {
    const agendas = await ConferenceAgenda.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      data: agendas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching agenda",
      error: error.message,
    });
  }
};

// Create a new agenda item (Day)
exports.createAgenda = async (req, res) => {
  try {
    const agenda = await ConferenceAgenda.create(req.body);
    res.status(201).json({
      success: true,
      data: agenda,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating agenda",
      error: error.message,
    });
  }
};

// Update an agenda item
exports.updateAgenda = async (req, res) => {
  try {
    const agenda = await ConferenceAgenda.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!agenda) {
      return res.status(404).json({ success: false, message: "Agenda not found" });
    }
    res.status(200).json({
      success: true,
      data: agenda,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating agenda",
      error: error.message,
    });
  }
};

// Delete an agenda item
exports.deleteAgenda = async (req, res) => {
  try {
    const agenda = await ConferenceAgenda.findByIdAndDelete(req.params.id);
    if (!agenda) {
      return res.status(404).json({ success: false, message: "Agenda not found" });
    }
    res.status(200).json({
      success: true,
      message: "Agenda deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting agenda",
      error: error.message,
    });
  }
};

// Bulk create/update (Optional, for easy seeding/initial setup)
exports.bulkUpdateAgenda = async (req, res) => {
  try {
    const { agendas } = req.body;
    // This is a simple implementation, you might want to use bulkWrite for better performance
    await ConferenceAgenda.deleteMany({}); // Clear existing if requested or handle merge logic
    const createdAgendas = await ConferenceAgenda.insertMany(agendas);
    res.status(200).json({
      success: true,
      data: createdAgendas,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error in bulk update",
      error: error.message,
    });
  }
};
