const FreeHealthCamp = require("../../models/visitor/FreeHealthCampModel");
const emailService = require("../../utils/emailService");
const whatsapp = require("../../utils/whatsapp");
const {
  generateRegistrationId,
} = require("../../utils/generateRegistrationId");
const { logActivity } = require("../../utils/logger");
const qrcode = require('qrcode');
const { processVisitorBulkUpload } = require("../../utils/visitorBulkUpload");

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
    const eventName = req.body.eventName || req.body.registrationFor || "";
    const registrationId = await generateRegistrationId("healthCamp", eventName);

    const visitor = new FreeHealthCamp({
      ...req.body,
        eventName: req.body.eventName || req.body.registrationFor || "IHWE",
      registrationId,
    });

    const siteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : 'https://ihwe.in';
    const qrPayload = `${siteUrl}/visitor?id=${registrationId}`;
    visitor.qrCode = await qrcode.toDataURL(qrPayload);

    const saved = await visitor.save();

    // Map fields for existing Visitor Email template
    const visitorData = {
      registrationFor: saved.registrationFor,
      firstName: saved.firstName,
      lastName: saved.lastName,
      fullName: `${saved.firstName} ${saved.lastName}`,
      email: saved.email,
      mobile: saved.mobile,
      alternateNo: saved.alternateNo,
      dateOfBirth: saved.dateOfBirth,
      gender: saved.gender,
      residenceAddress: saved.residenceAddress,
      country: saved.country,
      state: saved.state,
      city: saved.city,
      existingMedicalConditions: saved.existingMedicalConditions,
      isTakingMedications: saved.isTakingMedications,
      medicationNames: saved.medicationNames,
      hasAllergies: saved.hasAllergies,
      allergyDetails: saved.allergyDetails,
      isExperiencingSymptoms: saved.isExperiencingSymptoms,
      symptomDetails: saved.symptomDetails,
      healthCheckupServices: saved.healthCheckupServices,
      preferredDate: saved.preferredDate,
      preferredTimeSlot: saved.preferredTimeSlot,
      consentMedicalData: saved.consentMedicalData,
      agreeToUpdates: saved.agreeToUpdates,
      specificHealthConcerns: saved.specificHealthConcerns,
      visitorType: 'Health Camp Participant',
      registrationId: saved.registrationId,
      purposeOfVisit: 'Free Health Checkup',
      areaOfInterest: 'Healthcare Services',
      created_by: saved.created_by,
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
      { returnDocument: 'after' },
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


const bulkResendHealthCampVisitorMessages = async (req, res) => {
  try {
    const { visitorIds, types } = req.body;
    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No visitor IDs provided.' });
    }

    const sendEmail = types && types.includes('email');
    const sendWhatsapp = types ? types.includes('whatsapp') : true;

    const visitors = await FreeHealthCamp.find({ _id: { $in: visitorIds } });

    // See corporateVisitorController.bulkResendCorporateVisitorMessages —
    // sending is throttled 1s/message, so a large batch would otherwise
    // block the response past every realistic HTTP timeout. Respond now,
    // keep sending in the background.
    res.json({ success: true, message: `Sending messages to ${visitors.length} visitor(s) in the background.` });

    let sentCount = 0;
    for (const saved of visitors) {
      const visitorData = {
        registrationFor: saved.registrationFor,
        firstName: saved.firstName,
        lastName: saved.lastName,
        fullName: `${saved.firstName} ${saved.lastName}`,
        email: saved.email,
        mobile: saved.mobile,
        alternateNo: saved.alternateNo,
        dateOfBirth: saved.dateOfBirth,
        gender: saved.gender,
        residenceAddress: saved.residenceAddress,
        country: saved.country,
        state: saved.state,
        city: saved.city,
        existingMedicalConditions: saved.existingMedicalConditions,
        isTakingMedications: saved.isTakingMedications,
        medicationNames: saved.medicationNames,
        hasAllergies: saved.hasAllergies,
        allergyDetails: saved.allergyDetails,
        isExperiencingSymptoms: saved.isExperiencingSymptoms,
        symptomDetails: saved.symptomDetails,
        healthCheckupServices: saved.healthCheckupServices,
        preferredDate: saved.preferredDate,
        preferredTimeSlot: saved.preferredTimeSlot,
        consentMedicalData: saved.consentMedicalData,
        agreeToUpdates: saved.agreeToUpdates,
        specificHealthConcerns: saved.specificHealthConcerns,
        visitorType: 'Health Camp Participant',
        registrationId: saved.registrationId,
        purposeOfVisit: 'Free Health Checkup',
        areaOfInterest: 'Healthcare Services',
        created_by: saved.created_by,
        isResend: true,
      };

      if (sendEmail || sendWhatsapp) {
        try {
          await emailService.sendVisitorRegistrationEmails(visitorData);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error('Error resending visitor email:', err);
        }
      }

      sentCount++;
    }

    await logActivity(req, 'Action', 'Visitor Registrations', `Bulk resent messages to ${sentCount} health camp visitors.`);
  } catch (err) {
    console.error('Bulk resend error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
};

const bulkUploadHealthCampVisitors = async (req, res) => {
  return processVisitorBulkUpload({
    req, res, model: FreeHealthCamp, registrationType: "healthCamp",
    fields: {
      registrationFor: [], firstName: ["first name"], lastName: ["last name"], email: ["email address"], mobile: ["mobile number", "phone"], alternateNo: ["alternate number"],
      dateOfBirth: ["dob", "date of birth"], gender: [], bloodGroup: ["blood group"], residenceAddress: ["address", "residence address"], country: [], state: [], city: [], pincode: ["postal code"],
      existingMedicalConditions: ["medical history", "existing medical conditions"], isTakingMedications: ["taking medications"], medicationNames: ["medication names"], hasAllergies: ["has allergies"], allergyDetails: ["allergy details"],
      isExperiencingSymptoms: ["experiencing symptoms"], symptomDetails: ["symptom details"], preferredDate: ["preferred date"], preferredTimeSlot: ["preferred time slot"], consentMedicalData: ["medical data consent"], agreeToUpdates: ["whatsapp updates"], specificHealthConcerns: ["specific health concerns"], subscribe: [],
    },
    requiredFields: ["firstName", "lastName", "email", "mobile", "dateOfBirth", "gender"],
    transformRow: (row) => ({ ...row, registrationFor: row.registrationFor || "Health Camp Visitor", country: row.country || "India", status: "New Reg." }),
    generateRegistrationId,
    buildNotificationData: (visitor) => ({ registrationFor: visitor.registrationFor, firstName: visitor.firstName, lastName: visitor.lastName, fullName: `${visitor.firstName} ${visitor.lastName}`.trim(), email: visitor.email, mobile: visitor.mobile, alternateNo: visitor.alternateNo, dateOfBirth: visitor.dateOfBirth, gender: visitor.gender, residenceAddress: visitor.residenceAddress, country: visitor.country, state: visitor.state, city: visitor.city, existingMedicalConditions: visitor.existingMedicalConditions, isTakingMedications: visitor.isTakingMedications, medicationNames: visitor.medicationNames, hasAllergies: visitor.hasAllergies, allergyDetails: visitor.allergyDetails, isExperiencingSymptoms: visitor.isExperiencingSymptoms, symptomDetails: visitor.symptomDetails, healthCheckupServices: visitor.healthCheckupServices, preferredDate: visitor.preferredDate, preferredTimeSlot: visitor.preferredTimeSlot, consentMedicalData: visitor.consentMedicalData, agreeToUpdates: visitor.agreeToUpdates, specificHealthConcerns: visitor.specificHealthConcerns, visitorType: "Health Camp Participant", registrationId: visitor.registrationId, purposeOfVisit: "Free Health Checkup", areaOfInterest: "Healthcare Services", created_by: visitor.created_by }),
    sendNotification: (data) => emailService.sendVisitorRegistrationEmails(data, true),
    logActivity, activityLabel: "health camp",
  });
};

// ✅ EXPORT
module.exports = {
  getAllHealthCampVisitors,
  getHealthCampVisitorById,
  createHealthCampVisitor,
  updateHealthCampVisitor,
  deleteHealthCampVisitor,
  bulkResendHealthCampVisitorMessages,
  bulkUploadHealthCampVisitors,
};
