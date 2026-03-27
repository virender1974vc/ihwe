const ContactEnquiry = require('../models/ContactEnquiry');

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
        return await newEnquiry.save();
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
