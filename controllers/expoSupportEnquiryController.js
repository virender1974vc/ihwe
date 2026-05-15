const expoSupportEnquiryService = require('../services/expoSupportEnquiryService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Expo Support Enquiry requests.
 */
class ExpoSupportEnquiryController {
    /**
     * Submit an enquiry.
     */
    async submitEnquiry(req, res) {
        try {
            const data = await expoSupportEnquiryService.submitEnquiry(req.body);
            res.status(201).json({ success: true, message: 'Your enquiry has been submitted successfully! Our team will contact you shortly.', data });
        } catch (error) {
            console.error('Error submitting expo support enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Get all enquiries.
     */
    async getAllEnquiries(req, res) {
        try {
            const data = await expoSupportEnquiryService.getAllEnquiries();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching expo support enquiries:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Delete an enquiry.
     */
    async deleteEnquiry(req, res) {
        try {
            await expoSupportEnquiryService.deleteEnquiry(req.params.id);
            await logActivity(req, 'Deleted', 'Expo Support Enquiry', `Deleted expo support enquiry ID: ${req.params.id}`);
            res.json({ success: true, message: 'Enquiry removed' });
        } catch (error) {
            console.error('Error deleting expo support enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Update enquiry status.
     */
    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            await expoSupportEnquiryService.updateStatus(req.params.id, status);
            res.json({ success: true, message: 'Status updated' });
        } catch (error) {
            console.error('Error updating expo support status:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }
}

module.exports = new ExpoSupportEnquiryController();
