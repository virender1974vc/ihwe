const InternationalVisitor = require("../../models/visitor/InternationalVisitorModel");
const fs = require("fs");
const emailService = require("../../utils/emailService");
const { generateRegistrationId } = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");
const { normalizeVisitorMultiSelectFields } = require("../../utils/visitorSelectionNormalizer");
const qrcode = require('qrcode');

// ➤ Get all international visitors
const getAllInternationalVisitors = async (req, res) => {
  try {
    const visitors = await InternationalVisitor.find().sort({ createdAt: -1 });
    res.json({ data: visitors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Get visitor by ID
const getInternationalVisitorById = async (req, res) => {
  try {
    const visitor = await InternationalVisitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.json({ data: visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Create visitor
const createInternationalVisitor = async (req, res) => {
  try {
    const registrationId = await generateRegistrationId("international");

    // Check for uploaded files and get their paths
    const getFilePath = (fieldName) => {
      return req.files && req.files[fieldName] && req.files[fieldName][0]
        ? `/uploads/${req.files[fieldName][0].filename}`
        : "";
    };

    const documentFields = {
      passportCopyUrl: getFilePath("passport"),
      visitingCardUrl: getFilePath("visitingCard"),
      companyProfileUrl: getFilePath("companyProfile"),
      visaDocsUrl: getFilePath("visaDocs"),
      photoIdUrl: getFilePath("photoId"),
    };

    // Parse specific multi-select fields if they come as JSON strings (because of FormData)
    let parsedBody = { ...req.body };
    try {
      if (typeof req.body.purposeOfVisit === 'string') parsedBody.purposeOfVisit = JSON.parse(req.body.purposeOfVisit);
      if (typeof req.body.areaOfInterest === 'string') parsedBody.areaOfInterest = JSON.parse(req.body.areaOfInterest);
    } catch (e) {
      // Fallback if parsing fails or not valid JSON
    }

    const normalizedBody = normalizeVisitorMultiSelectFields(parsedBody);
    if (!normalizedBody.mobile && normalizedBody.mobileNo) {
      normalizedBody.mobile = normalizedBody.mobileNo;
    }

    const visitor = new InternationalVisitor({
      ...normalizedBody,
      ...documentFields,
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
      visitorType: 'International Visitor',
      purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['Business Networking'],
      areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['Healthcare'],
      city: saved.city || 'N/A',
      country: saved.country || 'N/A',
      registrationId: saved.registrationId,
      b2bMeeting: saved.b2bMeeting,
      designation: saved.designation || 'N/A',
      companyName: saved.companyName || 'N/A',
      registrationDate: saved.createdAt,
      created_by: saved.created_by,
    };

    emailService.sendVisitorConfirmationOnly(emailData, 'international-visitor').catch(err => {
      console.error("Error sending visitor registration notifications:", err);
    });

    emailService.sendDetailedVisitorNotification(emailData, 'admin').catch(err => {
      console.error("Error sending admin notification:", err);
    });

    if (saved.b2bMeeting && saved.b2bMeeting.toLowerCase() === 'yes') {
      emailService.sendDetailedVisitorNotification(emailData, 'b2b').catch(err => {
        console.error("Error sending B2B coordinator notification:", err);
      });
    }

    await logActivity(req, 'Created', 'Visitor Registrations', `Added new international visitor: ${saved.firstName} ${saved.lastName} (${saved.registrationId})`);

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInternationalVisitor = async (req, res) => {
  try {
    // Only overwrite a document URL when a new file for that slot was actually uploaded
    const getFilePath = (fieldName) => {
      return req.files && req.files[fieldName] && req.files[fieldName][0]
        ? `/uploads/${req.files[fieldName][0].filename}`
        : undefined;
    };

    const documentFields = {
      passportCopyUrl: getFilePath("passport"),
      visitingCardUrl: getFilePath("visitingCard"),
      companyProfileUrl: getFilePath("companyProfile"),
      visaDocsUrl: getFilePath("visaDocs"),
      photoIdUrl: getFilePath("photoId"),
    };
    Object.keys(documentFields).forEach((key) => documentFields[key] === undefined && delete documentFields[key]);

    let parsedBody = { ...req.body };
    try {
      if (typeof req.body.purposeOfVisit === 'string') parsedBody.purposeOfVisit = JSON.parse(req.body.purposeOfVisit);
      if (typeof req.body.areaOfInterest === 'string') parsedBody.areaOfInterest = JSON.parse(req.body.areaOfInterest);
    } catch (e) {
      // Fallback if parsing fails or not valid JSON
    }

    const normalizedBody = normalizeVisitorMultiSelectFields(parsedBody);

    const updated = await InternationalVisitor.findByIdAndUpdate(
      req.params.id,
      { ...normalizedBody, ...documentFields },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Visitor not found" });
    await logActivity(req, 'Updated', 'Visitor Registrations', `Updated international visitor: ${updated.firstName} ${updated.lastName}`);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteInternationalVisitor = async (req, res) => {
  try {
    const deleted = await InternationalVisitor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Visitor not found" });
    await logActivity(req, 'Deleted', 'Visitor Registrations', `Deleted international visitor: ${deleted.firstName} ${deleted.lastName}`);
    res.json({ message: "Visitor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const bulkUploadInternationalVisitors = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const xlsx = require('xlsx');
    const workbook = req.file.buffer 
        ? xlsx.read(req.file.buffer, { type: 'buffer' })
        : xlsx.readFile(req.file.path);
        
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.firstName || !row.email || !row.mobile || !row.gender || !row.nationality) {
          errors.push(`Row ${i + 2}: Missing required fields.`);
          continue;
        }

        const registrationId = await generateRegistrationId("international");
        const normalizedBody = normalizeVisitorMultiSelectFields(row);

        const visitor = new InternationalVisitor({ 
          ...normalizedBody, 
          registrationId,
          registrationFor: row.registrationFor || "International Visitor",
          created_by: 'Bulk Upload'
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
          visitorType: 'International Visitor',
          purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['Business Networking'],
          areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['Healthcare'],
          city: saved.city || 'N/A',
          country: saved.country || 'N/A',
          registrationId: saved.registrationId,
          b2bMeeting: saved.b2bMeeting,
          designation: saved.designation || 'N/A',
          companyName: saved.companyName || 'N/A',
          registrationDate: saved.createdAt,
          created_by: saved.created_by,
        };

        emailService.sendVisitorConfirmationOnly(emailData, 'international-visitor', true).catch(err => {
          console.error("Error sending bulk whatsapp notification:", err);
        });

        successCount++;
      } catch (rowErr) {
        errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    await logActivity(req, 'Action', 'Visitor Registrations', `Bulk uploaded ${successCount} international visitors.`);
    res.status(200).json({ success: true, message: `Successfully uploaded ${successCount} visitors.`, errors });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Bulk upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


const bulkResendInternationalVisitorMessages = async (req, res) => {
  try {
    const { visitorIds, types } = req.body;
    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ success: false, message: "No visitor IDs provided." });
    }

    const sendEmail = types && types.includes('email');
    const sendWhatsapp = types ? types.includes('whatsapp') : true;

    const visitors = await InternationalVisitor.find({ _id: { $in: visitorIds } });

    let sentCount = 0;
    for (const saved of visitors) {
      const emailData = {
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        mobileNo: saved.mobile,
        mobile: saved.mobile,
        visitorType: 'International Visitor',
        purposeOfVisit: saved.purposeOfVisit?.length ? saved.purposeOfVisit : ['Business Networking'],
        areaOfInterest: saved.areaOfInterest?.length ? saved.areaOfInterest : ['Healthcare'],
        city: saved.city || 'N/A',
        country: saved.country || 'N/A',
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
          const whatsappOnly = !sendEmail;
          await emailService.sendVisitorRegistrationEmails(emailData, whatsappOnly);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Error resending visitor email:", err);
        }
      }
      sentCount++;
    }

    await logActivity(req, 'Action', 'Visitor Registrations', `Bulk resent messages to ${sentCount} international visitors.`);
    res.json({ success: true, message: `Successfully queued messages for ${sentCount} visitors.` });
  } catch (err) {
    console.error("Bulk resend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  bulkResendInternationalVisitorMessages,
  getAllInternationalVisitors,
  getInternationalVisitorById,
  createInternationalVisitor,
  updateInternationalVisitor,
  deleteInternationalVisitor,
  bulkUploadInternationalVisitors,
};
