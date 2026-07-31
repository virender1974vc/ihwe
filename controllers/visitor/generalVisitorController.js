const GeneralVisitor = require("../../models/visitor/GeneralVisitorModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");
const {
  normalizeVisitorMultiSelectFields,
} = require("../../utils/visitorSelectionNormalizer");
const qrcode = require('qrcode');

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
    const normalizedBody = normalizeVisitorMultiSelectFields(req.body);

    const visitor = new GeneralVisitor({ ...normalizedBody, registrationId });
    const siteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : 'https://ihwe.in';
    const qrPayload = `${siteUrl}/visitor?id=${registrationId}`;
    visitor.qrCode = await qrcode.toDataURL(qrPayload);
    const saved = await visitor.save();

    const emailData = {
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      mobileNo: saved.mobile,
      mobile: saved.mobile,
      visitorType: 'General Visitor',
      purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['General Interest'],
      areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['General'],
      city: saved.city || 'N/A',
      country: saved.country || 'India',
      registrationId: saved.registrationId,
      registrationDate: saved.createdAt,
      created_by: saved.created_by,
    };

    // Send dynamic notifications (Email + WhatsApp) to User & Admin Alert
    emailService.sendVisitorRegistrationEmails(emailData).catch(err => {
      console.error("Error sending visitor registration notifications:", err);
    });

    await logActivity(req, 'Created', 'Visitor Registrations', `Added new general visitor: ${saved.firstName} ${saved.lastName} (${saved.registrationId})`);

    res.status(201).json({ data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGeneralVisitor = async (req, res) => {
  try {
    const normalizedBody = normalizeVisitorMultiSelectFields(req.body);
    const updated = await GeneralVisitor.findByIdAndUpdate(
      req.params.id,
      normalizedBody,
      { returnDocument: 'after' },
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

exports.bulkResendGeneralVisitorMessages = async (req, res) => {
  try {
    const { visitorIds, types } = req.body;
    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ success: false, message: "No visitor IDs provided." });
    }
    
    const sendEmail = types && types.includes('email');
    const sendWhatsapp = types ? types.includes('whatsapp') : true;

    const visitors = await GeneralVisitor.find({ _id: { $in: visitorIds } });
    
    let sentCount = 0;
    for (const saved of visitors) {
      const emailData = {
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        mobileNo: saved.mobile,
        mobile: saved.mobile,
        visitorType: 'General Visitor',
        purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['General Interest'],
        areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['General'],
        city: saved.city || 'N/A',
        country: saved.country || 'India',
        registrationId: saved.registrationId,
        registrationDate: saved.createdAt,
        created_by: saved.created_by,
        isResend: true,
      };

      if (sendEmail || sendWhatsapp) {
        emailService.sendVisitorRegistrationEmails(emailData).catch(err => {
          console.error("Error resending visitor email:", err);
        });
      }
      
      sentCount++;
    }

    await logActivity(req, 'Action', 'Visitor Registrations', `Bulk resent messages to ${sentCount} general visitors.`);
    res.json({ success: true, message: `Successfully queued messages for ${sentCount} visitors.` });
  } catch (err) {
    console.error("Bulk resend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
