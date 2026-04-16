const buyerRegistrationService = require('../services/buyerRegistrationService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Buyer Registration requests.
 */
class BuyerRegistrationController {
    /**
     * Create a new registration.
     */
    async createRegistration(req, res) {
        try {
            const files = req.files || {};
            const registrationData = {
                ...req.body,
                paymentProof: files['paymentProof'] ? `/uploads/payments/${files['paymentProof'][0].filename}` : undefined,
                companyProfile: files['companyProfile'] ? `/uploads/profiles/${files['companyProfile'][0].filename}` : undefined
            };
            const data = await buyerRegistrationService.createRegistration(registrationData);
            res.status(201).json({ success: true, message: 'Registration submitted successfully', data });
        } catch (err) {
            console.error('Error submitting buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get all registrations.
     */
    async getAllRegistrations(req, res) {
        try {
            const data = await buyerRegistrationService.getAllRegistrations();
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching buyer registrations:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Get a single registration.
     */
    async getRegistrationById(req, res) {
        try {
            const data = await buyerRegistrationService.getRegistrationById(req.params.id);
            res.json({ success: true, data });
        } catch (err) {
            console.error('Error fetching buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Update a registration.
     */
    async updateRegistration(req, res) {
        try {
            const data = await buyerRegistrationService.updateRegistration(req.params.id, req.body);
            await logActivity(req, 'Updated', 'Buyer Registration', `Updated buyer registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration updated successfully', data });
        } catch (err) {
            console.error('Error updating buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Delete a registration.
     */
    async deleteRegistration(req, res) {
        try {
            await buyerRegistrationService.deleteRegistration(req.params.id);
            await logActivity(req, 'Deleted', 'Buyer Registration', `Deleted buyer registration ID: ${req.params.id}`);
            res.json({ success: true, message: 'Registration removed' });
        } catch (err) {
            console.error('Error deleting buyer registration:', err);
            res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
        }
    }

    /**
     * Create Razorpay Order
     */
    async createOrder(req, res) {
        try {
            const { amount } = req.body;
            const order = await buyerRegistrationService.createOrder(amount);
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
            const data = await buyerRegistrationService.verifyPayment(regId, paymentDetails);
            res.json({ success: true, message: 'Payment verified', data });
        } catch (err) {
            console.error('Error verifying payment:', err);
            res.status(500).json({ success: false, message: 'Payment verification failed' });
        }
    }

    /**
     * Buyer Login
     */
    async login(req, res) {
        try {
            const { emailAddress, registrationId } = req.body;
            const data = await buyerRegistrationService.login(emailAddress, registrationId);
            res.json({ success: true, message: 'Login successful', data });
        } catch (err) {
            console.error('Error buyer login:', err);
            res.status(err.status || 500).json({ 
                success: false, 
                message: err.message || 'Login failed. Please check your credentials.' 
            });
        }
    }

    /**
     * Get Stats
     */
    async getStats(req, res) {
        try {
            const stats = await buyerRegistrationService.getStats();
            res.json({ success: true, stats });
        } catch (err) {
            console.error('Error fetching stats:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch stats' });
        }
    }
}

module.exports = new BuyerRegistrationController();
