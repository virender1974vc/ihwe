const SponsorshipEnquiry = require('../models/SponsorshipEnquiry');
const emailService = require('../utils/emailService');

/**
 * Service to handle Sponsorship Enquiry business logic.
 */
class SponsorshipEnquiryService {
    /**
     * Submit a new sponsorship enquiry.
     * @param {Object} enquiryData 
     */
    async submitEnquiry(enquiryData) {
        const enquiry = new SponsorshipEnquiry(enquiryData);
        const savedEnquiry = await enquiry.save();

        // Send Notifications (Email + WhatsApp) to User and Admin
        try {
            await emailService.sendSponsorshipConfirmation({
                email: enquiryData.email,
                name: enquiryData.fullName,
                company: enquiryData.companyName,
                phone: enquiryData.phone,
                category: enquiryData.category,
                message: enquiryData.message || 'N/A'
            });
        } catch (error) {
            console.error('Error sending sponsorship enquiry notifications:', error);
        }

        return savedEnquiry;
    }

    /**
     * Fetch all sponsorship enquiries.
     */
    async getAllEnquiries() {
        return await SponsorshipEnquiry.find().sort({ createdAt: -1 });
    }

    /**
     * Delete a sponsorship enquiry.
     * @param {String} id 
     */
    async deleteEnquiry(id) {
        const enquiry = await SponsorshipEnquiry.findById(id);
        if (!enquiry) {
            const error = new Error('Enquiry not found');
            error.status = 404;
            throw error;
        }
        return await enquiry.deleteOne();
    }

    /**
     * Update the status of an enquiry.
     * @param {String} id 
     * @param {String} status 
     */
    async updateStatus(id, status) {
        const enquiry = await SponsorshipEnquiry.findById(id);
        if (!enquiry) {
            const error = new Error('Enquiry not found');
            error.status = 404;
            throw error;
        }
        enquiry.status = status;
        return await enquiry.save();
    }
}

module.exports = new SponsorshipEnquiryService();
