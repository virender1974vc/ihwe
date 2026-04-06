const GeneralVisitor = require("../../models/visitor/GeneralVisitorModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");

exports.getAllGeneralVisitors = async (req, res) => {
  try {
    const visitors = await GeneralVisitor.find().sort({ createdAt: -1 });
    res.json({ data: visitors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGeneralVisitorById = async (req, res) => {
  try {
    const visitor = await GeneralVisitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.json({ data: visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGeneralVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("general");

    req.body.registrationId = registrationId;
    const visitor = new GeneralVisitor({ ...req.body, registrationId });
    const saved = await visitor.save();

    // Normalize data to match email template expectations
    const purposeKeys = saved.purposeOfVisit ? Object.entries(saved.purposeOfVisit).filter(([,v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()) : [];
    const interestKeys = saved.areaOfInterest ? Object.entries(saved.areaOfInterest).filter(([,v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()) : [];

    const emailData = {
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      mobileNo: saved.mobile,
      mobile: saved.mobile,
      visitorType: 'General Visitor',
      purposeOfVisit: purposeKeys.length ? purposeKeys : 'General Interest',
      areaOfInterest: interestKeys.length ? interestKeys : 'General',
      city: saved.city || 'N/A',
      country: saved.country || 'India',
      registrationId: saved.registrationId,
    };

    // Send confirmation emails (User & Admin) - Async
    emailService.sendVisitorRegistrationEmails(emailData).catch(err => {
      console.error("Error sending visitor registration emails:", err);
    });

    // Send WhatsApp confirmation - Async
    if (saved.mobile) {
      const whatsappMsg = `Dear ${saved.firstName}, thank you for registering as a ${emailData.visitorType} for the 9th IHWE 2026. Your Registration ID is: ${saved.registrationId}. We look forward to seeing you! - Namo Gange Trust`;
      whatsapp.sendWhatsAppMessage(saved.mobile, whatsappMsg, 'Visitor Registration').catch(err => {
        console.error("Error sending visitor WhatsApp message:", err);
      });
    }

    res.status(201).json({ data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGeneralVisitor = async (req, res) => {
  try {
    const updated = await GeneralVisitor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Visitor not found" });
    await logActivity(req, 'Updated', 'Visitor Registrations', `Updated general visitor ID: ${req.params.id}`);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGeneralVisitor = async (req, res) => {
  try {
    const deleted = await GeneralVisitor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Visitor not found" });
    await logActivity(req, 'Deleted', 'Visitor Registrations', `Deleted general visitor ID: ${req.params.id}`);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
