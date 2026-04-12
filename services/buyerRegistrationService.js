const BuyerRegistration = require('../models/BuyerRegistration');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');
const Razorpay = require('razorpay');

/**
 * Service to handle Buyer Registration operations.
 */
class BuyerRegistrationService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
        });
    }

    /**
     * Create a new buyer registration.
     * @param {Object} data - Registration data.
     * @returns {Promise<Object>} - Created registration.
     */
    async createRegistration(data) {
        // Validation (simplified for now, frontend handles most)
        const required = ['fullName', 'companyName', 'emailAddress', 'mobileNumber', 'registrationCategory'];
        for (const field of required) {
            if (!data[field]) throw { status: 400, message: `${field} is required` };
        }

        // 1. Calculate Buyer Tag (CRM Logic)
        data.buyerTag = this.calculateBuyerTag(data);

        const newRegistration = new BuyerRegistration(data);
        const saved = await newRegistration.save();

        // 2. Send Notifications
        this.sendNotifications(saved).catch(err => {
            console.error("Error sending buyer notifications:", err.message);
        });

        return saved;
    }

    /**
     * Calculate CRM Tag based on Budget (if applicable), Timeline, and Priority
     */
    calculateBuyerTag(data) {
        let score = 0;

        // Timeline Score
        const timeline = data.purchaseTimeline || '';
        if (timeline.includes('Immediate')) score += 3;
        else if (timeline.includes('1–3')) score += 2;
        else if (timeline.includes('3–6')) score += 1;

        // Priority Score
        const priority = data.meetingPriorityLevel || '';
        if (priority.includes('High')) score += 3;
        else if (priority.includes('Medium')) score += 2;
        else if (priority.includes('General')) score += 1;

        if (score >= 5) return 'Hot';
        if (score >= 3) return 'Warm';
        return 'Cold';
    }

    /**
     * Send Email and WhatsApp notifications
     */
    async sendNotifications(saved) {
        const notificationData = {
            name: saved.fullName,
            company: saved.companyName,
            email: saved.emailAddress,
            phone: saved.mobileNumber,
            city: saved.city,
            country: saved.country,
            category: saved.registrationCategory,
            tag: saved.buyerTag
        };

        // User Email
        emailService.sendDynamicConfirmation({
            to: saved.emailAddress,
            formType: 'buyer-registration',
            data: notificationData,
            profile: 'DEFAULT'
        }).catch(err => console.error("Email fail:", err.message));

        // WhatsApp to User
        const msg = `Hello ${saved.fullName},\n\nThank you for registering for the Buyer-Seller Meet at IHWE 2026. Your registration under ${saved.registrationCategory} category is received.\n\nOur team will review your application soon.\n\nRegards,\nIHWE Team`;
        whatsapp.sendWhatsAppMessage(saved.mobileNumber, msg, 'Buyer Registration').catch(err => console.error("WA fail:", err.message));
    }

    /**
     * Create Razorpay Order
     */
    async createOrder(amount, currency = 'INR') {
        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt: `buyer_reg_${Date.now()}`
        };
        return await this.razorpay.orders.create(options);
    }

    /**
     * Verifies Payment and updates registration
     */
    async verifyPayment(regId, paymentDetails) {
        const registration = await BuyerRegistration.findById(regId);
        if (!registration) throw { status: 404, message: 'Registration not found' };

        registration.paymentStatus = 'Completed';
        registration.razorpayPaymentId = paymentDetails.razorpay_payment_id;
        registration.razorpaySignature = paymentDetails.razorpay_signature;
        
        return await registration.save();
    }

    /**
     * Get all buyer registrations.
     */
    async getAllRegistrations() {
        return await BuyerRegistration.find().sort({ createdAt: -1 });
    }

    async getRegistrationById(id) {
        const registration = await BuyerRegistration.findById(id);
        if (!registration) throw { status: 404, message: 'Registration not found' };
        return registration;
    }

    async updateRegistration(id, data) {
        const updated = await BuyerRegistration.findByIdAndUpdate(id, data, { new: true });
        if (!updated) throw { status: 404, message: 'Registration not found' };
        return updated;
    }

    async deleteRegistration(id) {
        const registration = await BuyerRegistration.findById(id);
        if (!registration) throw { status: 404, message: 'Registration not found' };
        await registration.deleteOne();
    }
}

module.exports = new BuyerRegistrationService();
