const CorporateVisitor = require("../../models/visitor/CorporateVisitorModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");
const {
  normalizeVisitorMultiSelectFields,
} = require("../../utils/visitorSelectionNormalizer");

// ➤ Get all corporate visitors
const getAllCorporateVisitors = async (req, res) => {
  try {
    const visitors = await CorporateVisitor.find().sort({ createdAt: -1 });
    res.json({ data: visitors });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Get visitor by ID
const getCorporateVisitorById = async (req, res) => {
  try {
    const visitor = await CorporateVisitor.findById(req.params.id);

    if (!visitor) return res.status(404).json({ message: "Visitor not found" });

    res.json({ data: visitor });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Create visitor
const createCorporateVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("corporate");
    const normalizedBody = normalizeVisitorMultiSelectFields(req.body);

    const visitor = new CorporateVisitor({
      ...normalizedBody,
      registrationId,
    });

    const saved = await visitor.save();

    const emailData = {
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      mobileNo: saved.mobile,
      mobile: saved.mobile,
      visitorType: 'Corporate Visitor',
      purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['Business Networking'],
      areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['Healthcare'],
      city: saved.city || 'N/A',
      country: saved.country || 'India',
      registrationId: saved.registrationId,
      b2bMeeting: saved.b2bMeeting,
      designation: saved.designation || 'N/A',
      companyName: saved.companyName || 'N/A',
    };
    emailService.sendVisitorConfirmationOnly(emailData, 'corporate-visitor').catch(err => {
      console.error("Error sending visitor registration notifications:", err);
    });

    // Send NEW detailed template to Admin (always)
    emailService.sendDetailedVisitorNotification(emailData, 'admin').catch(err => {
      console.error("Error sending admin notification:", err);
    });

    // Debug: Check B2B Meeting value
    console.log(`[DEBUG] B2B Meeting value: "${saved.b2bMeeting}" (Type: ${typeof saved.b2bMeeting})`);

    // If B2B Meeting is "Yes" or "yes", send NEW detailed template to B2B Coordinator
    if (saved.b2bMeeting && saved.b2bMeeting.toLowerCase() === 'yes') {
      console.log('[DEBUG] B2B Meeting is Yes - sending to coordinator');
      emailService.sendDetailedVisitorNotification(emailData, 'b2b').catch(err => {
        console.error("Error sending B2B coordinator notification:", err);
      });
    } else {
      console.log(`[DEBUG] B2B Meeting is NOT Yes - value is: "${saved.b2bMeeting}"`);
    }

    await logActivity(req, 'Created', 'Visitor Registrations', `Added new corporate visitor: ${saved.firstName} ${saved.lastName} (${saved.registrationId})`);

    res.status(201).json({ data: saved });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Update visitor
const updateCorporateVisitor = async (req, res) => {
  try {
    const normalizedBody = normalizeVisitorMultiSelectFields(req.body);
    const updated = await CorporateVisitor.findByIdAndUpdate(
      req.params.id,
      normalizedBody,
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Visitor not found" });

    await logActivity(req, 'Updated', 'Visitor Registrations', `Updated corporate visitor ID: ${req.params.id}`);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ➤ Delete visitor
const deleteCorporateVisitor = async (req, res) => {
  try {
    const deleted = await CorporateVisitor.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Visitor not found" });

    await logActivity(req, 'Deleted', 'Visitor Registrations', `Deleted corporate visitor ID: ${req.params.id}`);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ✅ EXPORT
module.exports = {
  getAllCorporateVisitors,
  getCorporateVisitorById,
  createCorporateVisitor,
  updateCorporateVisitor,
  deleteCorporateVisitor,
};
