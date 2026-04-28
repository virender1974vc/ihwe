const sellerRegistrationService = require('../services/sellerRegistrationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Seller Registration requests.
 */
class SellerRegistrationController {
    /**
     * Create a new registration.
     */
    async createRegistration(req, res) {
        try {
            const files = req.files || {};
            const registrationData = {
                ...req.body,
                paymentProof: files['paymentProof'] ? `/uploads/payments/${files['paymentProof'][0].filename}` : undefined,
                companyCatalog: files['companyCatalog'] ? `/uploads/profiles/${files['companyCatalog'][0].filename}` : undefined
            };
            const data = await sellerRegistrationService.createRegistration(registrationData);
            res.status(201).json({ success: true, message: 'Registration submitted successfully', data });
        } catch (err) {
            console.error('Error submitting seller registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get all registrations.
     */
    async getAllRegistrations(req, res) {
        try {
            const data = await sellerRegistrationService.getAllRegistrations();
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching seller registrations:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get a single registration.
     */
    async getRegistrationById(req, res) {
        try {
            const data = await sellerRegistrationService.getRegistrationById(req.params.id);
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching seller registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Update a registration.
     */
    async updateRegistration(req, res) {
        try {
            const data = await sellerRegistrationService.updateRegistration(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Seller Registration', `Updated seller registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration updated successfully', data });
        } catch (err) {
            console.error('Error updating seller registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Delete a registration.
     */
    async deleteRegistration(req, res) {
        try {
            await sellerRegistrationService.deleteRegistration(req.params.id);
            await logActivity(req, 'Deleted', 'Seller Registration', `Deleted seller registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration removed' });
        } catch (err) {
            console.error('Error deleting seller registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Create Razorpay Order
     */
    async createOrder(req, res) {
        try {
            const { amount } = req.body;
            const order = await sellerRegistrationService.createOrder(amount);
            res.json({ success: true, order });
        } catch (err) {
            console.error('Error creating Razorpay order:', err);
            res.status(500).json({ success: false, message: 'Failed to create payment order' });
        }
    }

    /**
     * Verify Payment
     */
    async verifyPayment(req, res) {
        try {
            const { regId, paymentDetails } = req.body;
            const data = await sellerRegistrationService.verifyPayment(regId, paymentDetails);
            res.json({ success: true, message: 'Payment verified', data });
        } catch (err) {
            console.error('Error verifying payment:', err);
            res.status(500).json({ success: false, message: 'Payment verification failed' });
        }
    }

    /**
     * Get Stats
     */
    async getStats(req, res) {
        try {
            const stats = await sellerRegistrationService.getStats();
            res.json({ success: true, stats });
        } catch (err) {
            console.error('Error fetching stats:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch stats' });
        }
    }
}

module.exports = new SellerRegistrationController();
