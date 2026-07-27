const ExpoSupportEnquiry = require('../models/ExpoSupportEnquiry');
const emailService = require('../utils/emailService');

/**
 * Service to handle Expo Support Enquiry business logic.
 */
class ExpoSupportEnquiryService {
    /**
     * Submit a new expo support enquiry.
     * @param {Object} enquiryData 
     */
    async submitEnquiry(enquiryData) {
        const enquiry = new ExpoSupportEnquiry(enquiryData);
        const savedEnquiry = await enquiry.save();

        // Send Notifications (Email + WhatsApp) to User and Admin
        try {
            await emailService.sendExpoSupportConfirmation({
                email: enquiryData.email,
                name: enquiryData.fullName,
                company: enquiryData.companyName,
                phone: enquiryData.mobile,
                services: enquiryData.selectedServices,
                message: enquiryData.message || 'N/A'
            });
        } catch (error) {
            console.error('Error sending expo support enquiry notifications:', error);
        }

        return savedEnquiry;
    }

    /**
     * Fetch all expo support enquiries.
     */
    async getAllEnquiries() {
        return await ExpoSupportEnquiry.find().sort({ createdAt: -1 });
    }

    /**
     * Delete an enquiry.
     * @param {String} id 
     */
    async deleteEnquiry(id) {
        const enquiry = await ExpoSupportEnquiry.findById(id);
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
        const enquiry = await ExpoSupportEnquiry.findById(id);
        if (!enquiry) {
            const error = new Error('Enquiry not found');
            error.status = 404;
            throw error;
        }
        enquiry.status = status;
        return await enquiry.save();
    }
}

module.exports = new ExpoSupportEnquiryService();
