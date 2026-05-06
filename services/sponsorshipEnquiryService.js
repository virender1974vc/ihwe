const SponsorshipEnquiry = require('../models/SponsorshipEnquiry');

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
        return await enquiry.save();
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
