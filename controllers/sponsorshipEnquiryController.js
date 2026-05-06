const sponsorshipEnquiryService = require('../services/sponsorshipEnquiryService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Sponsorship Enquiry requests.
 */
class SponsorshipEnquiryController {
    /**
     * Submit a sponsorship enquiry.
     */
    async submitEnquiry(req, res) {
        try {
            const data = await sponsorshipEnquiryService.submitEnquiry(req.body);
            res.status(201).json({ success: true, message: 'Your sponsorship enquiry has been submitted successfully!', data });
        } catch (error) {
            console.error('Error submitting sponsorship enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Get all sponsorship enquiries.
     */
    async getAllEnquiries(req, res) {
        try {
            const data = await sponsorshipEnquiryService.getAllEnquiries();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching sponsorship enquiries:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Delete a sponsorship enquiry.
     */
    async deleteEnquiry(req, res) {
        try {
            await sponsorshipEnquiryService.deleteEnquiry(req.params.id);
            await logActivity(req, 'Deleted', 'Sponsorship Enquiry', `Deleted sponsorship enquiry ID: ${req.params.id}`);
            res.json({ success: true, message: 'Enquiry removed' });
        } catch (error) {
            console.error('Error deleting sponsorship enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Update enquiry status.
     */
    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            await sponsorshipEnquiryService.updateStatus(req.params.id, status);
            res.json({ success: true, message: 'Status updated' });
        } catch (error) {
            console.error('Error updating sponsorship status:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }
}

module.exports = new SponsorshipEnquiryController();
