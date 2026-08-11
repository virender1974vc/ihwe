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
const qrcode = require('qrcode');
const { processVisitorBulkUpload } = require("../../utils/visitorBulkUpload");

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
      visitorType: 'Corporate Visitor',
      purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['Business Networking'],
      areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['Healthcare'],
      city: saved.city || 'N/A',
      country: saved.country || 'India',
      registrationId: saved.registrationId,
      b2bMeeting: saved.b2bMeeting,
      designation: saved.designation || 'N/A',
      companyName: saved.companyName || 'N/A',
      registrationDate: saved.createdAt,
      created_by: saved.created_by,
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
      { returnDocument: 'after' },
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

// ➤ Bulk Resend Messages
const bulkResendCorporateVisitorMessages = async (req, res) => {
  try {
    const { visitorIds, types } = req.body; // types: ['email', 'whatsapp']
    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ success: false, message: "No visitor IDs provided." });
    }

    const sendEmail = types && types.includes('email');
    const sendWhatsapp = types ? types.includes('whatsapp') : true; // Default to both if not specified

    const visitors = await CorporateVisitor.find({ _id: { $in: visitorIds } });

    let sentCount = 0;
    for (const saved of visitors) {
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
        registrationDate: saved.createdAt,
        created_by: saved.created_by,
        isResend: true,
      };

      if (sendEmail || sendWhatsapp) {
        try {
          await emailService.sendVisitorRegistrationEmails(emailData);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Error resending visitor messages:", err);
        }
      }
      sentCount++;
    }

    await logActivity(req, 'Action', 'Visitor Registrations', `Bulk resent messages to ${sentCount} corporate visitors.`);
    res.json({ success: true, message: `Successfully queued messages for ${sentCount} visitors.` });
  } catch (err) {
    console.error("Bulk resend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ➤ Upload Corporate Visitors from Excel
const uploadCorporateVisitors = async (req, res) => {
  return processVisitorBulkUpload({
    req, res, model: CorporateVisitor, registrationType: "corporate",
    fields: {
      registrationFor: [], firstName: ["first name"], lastName: ["last name"], email: ["email address"], mobile: ["mobile number", "phone"],
      designation: [], companyName: ["company"], companyWebsite: ["website"], industrySector: ["industry"], companySize: [], country: [], state: [], city: [],
      b2bMeeting: ["b2b meeting"], whatsappUpdates: ["whatsapp updates"], specificRequirement: ["specific requirement"], purposeOfVisit: ["purpose of visit"], areaOfInterest: ["area of interest"],
    },
    requiredFields: ["firstName", "lastName", "email", "mobile"],
    transformRow: (row, { parseList }) => ({ ...row, registrationFor: row.registrationFor || "Corporate Visitor", country: row.country || "India", b2bMeeting: row.b2bMeeting || "No", whatsappUpdates: row.whatsappUpdates || "Yes", purposeOfVisit: parseList(row.purposeOfVisit), areaOfInterest: parseList(row.areaOfInterest), status: "New Reg." }),
    generateRegistrationId,
    buildNotificationData: (visitor) => ({ firstName: visitor.firstName, lastName: visitor.lastName, email: visitor.email, mobileNo: visitor.mobile, mobile: visitor.mobile, visitorType: "Corporate Visitor", purposeOfVisit: visitor.purposeOfVisit?.length ? visitor.purposeOfVisit : ["Business Networking"], areaOfInterest: visitor.areaOfInterest?.length ? visitor.areaOfInterest : ["Healthcare"], city: visitor.city || "N/A", country: visitor.country || "India", registrationId: visitor.registrationId, b2bMeeting: visitor.b2bMeeting, designation: visitor.designation || "N/A", companyName: visitor.companyName || "N/A", registrationDate: visitor.createdAt, created_by: visitor.created_by }),
    sendNotification: (data) => emailService.sendVisitorConfirmationOnly(data, "corporate-visitor", true),
    logActivity, activityLabel: "corporate",
  });
};

// ✅ EXPORT
module.exports = {
  getAllCorporateVisitors,
  getCorporateVisitorById,
  createCorporateVisitor,
  updateCorporateVisitor,
  deleteCorporateVisitor,
  uploadCorporateVisitors,
  bulkResendCorporateVisitorMessages,
};
