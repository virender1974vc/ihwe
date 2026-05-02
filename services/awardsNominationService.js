const AwardsNomination = require('../models/AwardsNomination');
const { sendWhatsAppMessage } = require('../utils/whatsapp');

class AwardsNominationService {

  // ─── Submit Nomination ───
  async submitNomination(data) {
    const { applicantType, fullName, contactPersonName, mobile, email, awardCategory } = data;

    if (!applicantType || !fullName || !contactPersonName || !mobile || !email || !awardCategory) {
      throw { status: 400, message: 'Required fields are missing' };
    }

    const nomination = new AwardsNomination(data);
    const saved = await nomination.save();

    // ── WhatsApp to Applicant ──
    const applicantMsg =
      `🏆 *Namo Gange Global Health Excellence Awards 2026*\n\n` +
      `Namo Gange Namaskar! 🙏\n\n` +
      `Dear *${fullName}*,\n\n` +
      `Thank you for submitting your nomination for the *${awardCategory}* category.\n\n` +
      `📋 *Nomination Details:*\n` +
      `• Applicant: ${fullName}\n` +
      `• Category: ${awardCategory}\n` +
      `• Type: ${applicantType}\n` +
      `• Status: *Pending Review*\n\n` +
      `Our jury team will review your nomination and get back to you shortly.\n\n` +
      `For any queries, contact us at:\n` +
      `📞 +91 93104 68663\n` +
      `📧 info@ihwe.in\n\n` +
      `– Team IHWE\n` +
      `Namo Gange Wellness Pvt. Ltd.`;

    sendWhatsAppMessage(mobile, applicantMsg, fullName).catch(err =>
      console.error('[Awards Nomination] WhatsApp to applicant failed:', err)
    );

    // ── WhatsApp Admin Alert ──
    const adminMobile = process.env.ADMIN_WHATSAPP_NUMBER || '919310468663';
    const adminMsg =
      `🔔 *New Awards Nomination Received!*\n\n` +
      `📋 *Details:*\n` +
      `• Name: ${fullName}\n` +
      `• Contact Person: ${contactPersonName}\n` +
      `• Mobile: ${mobile}\n` +
      `• Email: ${email}\n` +
      `• Category: ${awardCategory}\n` +
      `• Type: ${applicantType}\n` +
      `• City: ${data.city || 'N/A'}\n\n` +
      `Login to admin panel to review this nomination.\n\n` +
      `– IHWE System Alert`;

    sendWhatsAppMessage(adminMobile, adminMsg, 'Admin').catch(err =>
      console.error('[Awards Nomination] WhatsApp to admin failed:', err)
    );

    return saved;
  }

  // ─── Get All Nominations ───
  async getAllNominations(filters = {}) {
    const query = {};

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.awardCategory && filters.awardCategory !== 'all') {
      query.awardCategory = filters.awardCategory;
    }
    if (filters.applicantType && filters.applicantType !== 'all') {
      query.applicantType = filters.applicantType;
    }
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { fullName: regex },
        { email: regex },
        { mobile: regex },
        { contactPersonName: regex },
        { awardCategory: regex },
      ];
    }

    const nominations = await AwardsNomination.find(query).sort({ createdAt: -1 });

    // Stats
    const stats = {
      total: await AwardsNomination.countDocuments(),
      pending: await AwardsNomination.countDocuments({ status: 'Pending' }),
      underReview: await AwardsNomination.countDocuments({ status: 'Under Review' }),
      approved: await AwardsNomination.countDocuments({ status: 'Approved' }),
      rejected: await AwardsNomination.countDocuments({ status: 'Rejected' }),
    };

    return { nominations, stats };
  }

  // ─── Get Single Nomination ───
  async getNominationById(id) {
    const nomination = await AwardsNomination.findById(id);
    if (!nomination) throw { status: 404, message: 'Nomination not found' };
    return nomination;
  }

  // ─── Update Status ───
  async updateStatus(id, status, adminRemarks, updatedBy) {
    const allowed = ['Pending', 'Under Review', 'Approved', 'Rejected'];
    if (!allowed.includes(status)) {
      throw { status: 400, message: 'Invalid status value' };
    }

    const nomination = await AwardsNomination.findByIdAndUpdate(
      id,
      { status, adminRemarks: adminRemarks || '', updated_by: updatedBy || 'Admin' },
      { new: true }
    );

    if (!nomination) throw { status: 404, message: 'Nomination not found' };

    // ── WhatsApp notification to applicant on status change ──
    const statusEmoji = {
      'Pending': '⏳',
      'Under Review': '🔍',
      'Approved': '✅',
      'Rejected': '❌',
    };

    const statusMsg =
      `🏆 *Namo Gange Global Health Excellence Awards 2026*\n\n` +
      `Dear *${nomination.fullName}*,\n\n` +
      `Your nomination status has been updated:\n\n` +
      `${statusEmoji[status]} *Status: ${status}*\n` +
      `📋 Category: ${nomination.awardCategory}\n` +
      (adminRemarks ? `📝 Remarks: ${adminRemarks}\n` : '') +
      `\nFor queries, contact us at +91 93104 68663\n\n` +
      `– Team IHWE\nNamo Gange Wellness Pvt. Ltd.`;

    sendWhatsAppMessage(nomination.mobile, statusMsg, nomination.fullName).catch(err =>
      console.error('[Awards Nomination] Status update WhatsApp failed:', err)
    );

    return nomination;
  }

  // ─── Delete Nomination ───
  async deleteNomination(id) {
    const nomination = await AwardsNomination.findById(id);
    if (!nomination) throw { status: 404, message: 'Nomination not found' };
    return await nomination.deleteOne();
  }
}

module.exports = new AwardsNominationService();
