const FreeHealthCamp = require("../../models/visitor/FreeHealthCampModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");

// ➤ Get all health camp visitors
const getAllHealthCampVisitors = async (req, res) => {
  try {
    const visitors = await FreeHealthCamp.find().sort({ createdAt: -1 });
    res.json({ data: visitors });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Get visitor by ID
const getHealthCampVisitorById = async (req, res) => {
  try {
    const visitor = await FreeHealthCamp.findById(req.params.id);

    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    res.json({ data: visitor });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Create visitor
const createHealthCampVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("healthCamp");

    const visitor = new FreeHealthCamp({
      ...req.body,
      registrationId,
    });

    const saved = await visitor.save();

    // Map fields for existing Visitor Email template
    const visitorData = {
      fullName: `${saved.firstName} ${saved.lastName}`,
      email: saved.email,
      mobile: saved.mobile,
      city: saved.city || 'N/A',
      country: saved.country || 'India',
      visitorType: 'Health Camp Participant',
      registrationId: saved.registrationId,
      purposeOfVisit: 'Free Health Checkup',
      areaOfInterest: 'Healthcare Services'
    };

    // Send dynamic notifications (Email + WhatsApp) to User & Admin Alert
    emailService.sendVisitorRegistrationEmails(visitorData).catch(err => {
      console.error("Error sending health camp registration notifications:", err);
    });

    await logActivity(req, 'Created', 'Visitor Registrations', `Added new health camp visitor: ${saved.firstName} ${saved.lastName} (${saved.registrationId})`);

    res.status(201).json({ data: saved });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Update visitor
const updateHealthCampVisitor = async (req, res) => {
  try {
    const updated = await FreeHealthCamp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Visitor not found" });

    await logActivity(req, 'Updated', 'Visitor Registrations', `Updated health camp visitor ID: ${req.params.id}`);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Delete visitor
const deleteHealthCampVisitor = async (req, res) => {
  try {
    const deleted = await FreeHealthCamp.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Visitor not found" });

    await logActivity(req, 'Deleted', 'Visitor Registrations', `Deleted health camp visitor ID: ${req.params.id}`);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
};
