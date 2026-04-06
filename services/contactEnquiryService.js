const ContactEnquiry = require('../models/ContactEnquiry');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

/**
 * Service to handle Contact Enquiry operations.
 */
class ContactEnquiryService {
    /**
     * Submit a contact enquiry.
     */
    async submitEnquiry(data) {
        const { name, email, phone, service, message } = data;
        if (!name || !email || !phone || !service || !message) {
            throw { status: 400, message: 'All fields are required' };
        }
        const newEnquiry = new ContactEnquiry({ name, email, phone, service, message });
        const savedEnquiry = await newEnquiry.save();

        // 1. Send Professional Emails (Async - don't await)
        emailService.sendContactUsEmails(savedEnquiry).catch(err => console.error('Contact Email Error:', err));

        // 2. Send WhatsApp Notifications (Async)
        try {
            // Clean phone number (remove non-digits)
            const userPhone = phone.replace(/\D/g, '');
            const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

            // User Confirmation Message
            const userMsg = `Hello ${name}! 👋\n\nThank you for contacting IHWE - Global Health Connect. We have received your inquiry regarding "${service}".\n\nOur team will review your message and get back to you shortly.\n\nBest Regards,\nTeam IHWE`;
            
            // Admin Lead Alert
            const adminMsg = `🔥 *NEW CONTACT ENQUIRY* 🔥\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n🛠 *Service:* ${service}\n\n📝 *Message:* ${message}\n\nCheck the Admin Panel for more details.`;

            // Trigger both (we don't await to avoid delaying the response, but we log the attempts)
            whatsapp.sendWhatsAppMessage(userPhone, userMsg);
            if (adminPhone) {
                whatsapp.sendWhatsAppMessage(adminPhone, adminMsg);
            }
        } catch (wsError) {
            console.error('WhatsApp Notification Error:', wsError);
        }

        return savedEnquiry;
    }

    /**
     * Get all contact enquiries.
     */
    async getAllEnquiries() {
        return await ContactEnquiry.find().sort({ createdAt: -1 });
    }

    /**
     * Delete a contact enquiry.
     */
    async deleteEnquiry(id) {
        const enquiry = await ContactEnquiry.findById(id);
        if (!enquiry) {
            throw { status: 404, message: 'Enquiry not found' };
        }
        return await enquiry.deleteOne();
    }
}

module.exports = new ContactEnquiryService();
