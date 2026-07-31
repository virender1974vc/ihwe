const CorporateVisitor = require("../../models/visitor/CorporateVisitorModel");
const fs = require("fs");
const XLSX = require("xlsx");
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

    const qrPayload = JSON.stringify({ type: 'visitor', registrationId });
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
      };

      if (sendEmail || sendWhatsapp) {
        emailService.sendVisitorRegistrationEmails(emailData).catch(err => {
          console.error("Error resending visitor messages:", err);
        });
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
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Excel file required" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!rows.length) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Excel file is empty" });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const email = String(row.email || "").trim().toLowerCase();
      const mobile = String(row.mobile || "").trim();

      if (!email && !mobile) {
        skippedCount++;
        continue;
      }

      // Check for duplicate by email OR mobile
      const existing = await CorporateVisitor.findOne({
        $or: [
          ...(email ? [{ email }] : []),
          ...(mobile ? [{ mobile }] : [])
        ]
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const registrationId = await generateRegistrationId("corporate");
      const qrPayload = JSON.stringify({ type: 'visitor', registrationId });
      const qrCode = await qrcode.toDataURL(qrPayload);

      const visitorData = {
        registrationId,
        registrationFor: row.registrationFor || "Corporate Visitor",
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        email,
        mobile,
        designation: row.designation || "",
        companyName: row.companyName || "",
        companyWebsite: row.companyWebsite || "",
        industrySector: row.industrySector || "",
        companySize: row.companySize || "",
        country: row.country || "India",
        state: row.state || "",
        city: row.city || "",
        b2bMeeting: row.b2bMeeting || "No",
        whatsappUpdates: row.whatsappUpdates || "Yes",
        specificRequirement: row.specificRequirement || "",
        purposeOfVisit: row.purposeOfVisit ? String(row.purposeOfVisit).split(',').map(s => s.trim()) : [],
        areaOfInterest: row.areaOfInterest ? String(row.areaOfInterest).split(',').map(s => s.trim()) : [],
        qrCode,
        status: "New Reg.",
        created_by: req.user ? req.user.username : "Bulk Import",
      };

      const visitor = new CorporateVisitor(visitorData);
      await visitor.save();
      insertedCount++;
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Import complete. Inserted: ${insertedCount}, Skipped (duplicates/invalid): ${skippedCount}`
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Error importing corporate visitors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
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
