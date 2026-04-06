const SpeakerNomination = require('../models/SpeakerNomination');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

/**
 * Service to handle Speaker Nomination operations.
 */
class SpeakerNominationService {
    /**
     * Submit a speaker nomination.
     */
    async submitNomination(data) {
        const { 
            title, firstName, lastName, officialEmail, mobileNo, 
            linkedinUrl, organizationName, designation, areaOfExpertise, 
            country, state, city, proposedTopic, shortBiography 
        } = data;

        // Basic Validation
        if (!firstName || !lastName || !officialEmail || !mobileNo || !organizationName || !designation || !proposedTopic) {
            throw { status: 400, message: 'Required fields are missing' };
        }

        const newNomination = new SpeakerNomination(data);
        const savedNomination = await newNomination.save();

        const fullName = `${title.toUpperCase()} ${firstName} ${lastName}`;

        // 1. Send Professional Emails (Async)
        emailService.sendSpeakerNominationEmails(savedNomination).catch(err => {
            console.error('Speaker Email Notification Error:', err);
        });

        // 2. Send WhatsApp Notifications (Async)
        try {
            const userPhone = mobileNo.replace(/\D/g, '');
            const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
            const speakerAdminEmail = process.env.SPEAKER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

            // User Confirmation Message
            const userMsg = `Dear ${fullName}! 👋\n\nThank you for nominating yourself as a speaker for IHWE 2026. 🎙️\n\nWe have received your proposal regarding "${proposedTopic}". Our scientific committee will review your profile and get back to you shortly.\n\nBest Regards,\nScientific Committee | IHWE`;
            
            // Admin Lead Alert
            const adminMsg = `🎙️ *NEW SPEAKER NOMINATION* 🎙️\n\n👤 *Name:* ${fullName}\n📧 *Email:* ${officialEmail}\n📱 *Phone:* ${mobileNo}\n🏢 *Org:* ${organizationName}\n🎓 *Expertise:* ${areaOfExpertise}\n\n📝 *Topic:* ${proposedTopic}\n\nCheck the Admin Panel for full biography and details.`;

            // Trigger both
            whatsapp.sendWhatsAppMessage(userPhone, userMsg, 'Speaker Confirmation');
            if (adminPhone) {
                whatsapp.sendWhatsAppMessage(adminPhone, adminMsg, 'Speaker Lead Alert');
            }
        } catch (wsError) {
            console.error('Speaker WhatsApp Notification Error:', wsError);
        }

        return savedNomination;
    }

    /**
     * Get all speaker nominations.
     */
    async getAllNominations() {
        return await SpeakerNomination.find().sort({ createdAt: -1 });
    }

    /**
     * Delete a speaker nomination.
     */
    async deleteNomination(id) {
        const nomination = await SpeakerNomination.findById(id);
        if (!nomination) {
            throw { status: 404, message: 'Nomination not found' };
        }
        return await nomination.deleteOne();
    }
}

module.exports = new SpeakerNominationService();
