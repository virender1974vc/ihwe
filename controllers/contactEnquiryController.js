const contactEnquiryService = require('../services/contactEnquiryService');

/**
 * Controller to handle Contact Enquiry requests.
 */
class ContactEnquiryController {
    /**
     * Submit a contact enquiry.
     */
    async submitEnquiry(req, res) {
        try {
            const data = await contactEnquiryService.submitEnquiry(req.body);
            res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data });
        } catch (error) {
            console.error('Error submitting enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }

    /**
     * Get all contact enquiries.
     */
    async getAllEnquiries(req, res) {
        try {
            const data = await contactEnquiryService.getAllEnquiries();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching enquiries:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Delete a contact enquiry.
     */
    async deleteEnquiry(req, res) {
        try {
            await contactEnquiryService.deleteEnquiry(req.params.id);
            res.json({ success: true, message: 'Enquiry removed' });
        } catch (error) {
            console.error('Error deleting enquiry:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server Error' });
        }
    }
}

module.exports = new ContactEnquiryController();
