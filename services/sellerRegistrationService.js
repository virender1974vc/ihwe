const SellerRegistration = require('../models/SellerRegistration');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');
const Razorpay = require('razorpay');

/**
 * Service to handle Seller Registration operations.
 */
class SellerRegistrationService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
        });
    }

    /**
     * Create a new seller registration.
     */
    async createRegistration(data) {
        // Validation
        const required = ['companyName', 'emailAddress', 'mobileNumber', 'registrationCategory'];
        for (const field of required) {
            if (!data[field]) throw { status: 400, message: `${field} is required` };
        }

        // Handle Array fields from FormData
        const arrayFields = [
            'secondaryProductCategories', 
            'targetMarket', 
            'preferredBuyerType', 
            'preferredBuyerRegion', 
            'certifications', 
            'shippingTermsIndices', 
            'preferredPaymentTerms'
        ];
        arrayFields.forEach(field => {
            if (data[field] && typeof data[field] === 'string') {
                try {
                    data[field] = JSON.parse(data[field]);
                } catch (e) {
                    if (data[field].includes(',')) data[field] = data[field].split(',').map(s => s.trim());
                }
            }
        });

        // 1. Calculate Seller Tag (CRM Logic)
        data.sellerTag = this.calculateSellerTag(data);

        // 2. Generate registrationId
        const year = new Date().getFullYear();
        const randSeller = Math.floor(100 + Math.random() * 899);
        
        if (!data.registrationId) {
            data.registrationId = `IHWE/${year}/SLR-${randSeller}`;
        }

        const newRegistration = new SellerRegistration(data);
        const saved = await newRegistration.save();

        // 3. Send Notifications
        if (saved.paymentStatus !== 'Failed') {
            this.sendNotifications(saved).catch(err => {
                console.error("Error sending seller notifications:", err.message);
            });
        }

        return saved;
    }

    /**
     * Calculate CRM Tag for Seller
     */
    calculateSellerTag(data) {
        let score = 0;
        const turnover = data.annualTurnover || '';
        if (turnover.includes('> 50') || turnover.includes('100')) score += 3;
        else if (turnover.includes('10 - 25') || turnover.includes('25 - 50')) score += 2;
        else score += 1;

        const priority = data.meetingPriorityLevel || '';
        if (priority.includes('High')) score += 3;
        else if (priority.includes('Medium')) score += 2;
        else score += 1;

        if (score >= 5) return 'Hot';
        if (score >= 3) return 'Warm';
        return 'Cold';
    }

    async sendNotifications(saved) {
        // Confirmation to User
        emailService.sendVisitorConfirmationOnly(saved, 'seller-registration').catch(err => {
            console.error("Seller user email fail:", err.message);
        });

        // Alert to Admin
        emailService.notifyAdmin('seller-registration', saved, `New Seller Registration: ${saved.companyName}`, 'EXHIBITOR').catch(err => {
            console.error("Seller admin notification fail:", err.message);
        });

        // WhatsApp to User
        const msg = `Hello ${saved.companyName},\n\nThank you for registering as a Seller for the Buyer-Seller Meet at IHWE 2026. Your registration under ${saved.registrationCategory} category is received.\n\nOur team will review your profile and match you with relevant buyers soon.\n\nRegards,\nIHWE Team`;
        whatsapp.sendWhatsAppMessage(saved.mobileNumber, msg, 'Seller Registration').catch(err => console.error("Seller WA fail:", err.message));
    }

    async createOrder(amount, currency = 'INR') {
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `seller_reg_${Date.now()}`
        };
        return await this.razorpay.orders.create(options);
    }

    async verifyPayment(regId, paymentDetails) {
        const registration = await SellerRegistration.findById(regId);
        if (!registration) throw { status: 404, message: 'Registration not found' };

        registration.paymentStatus = 'Completed';
        registration.razorpayPaymentId = paymentDetails.razorpay_payment_id;
        registration.razorpaySignature = paymentDetails.razorpay_signature;
        
        return await registration.save();
    }

    async getAllRegistrations() {
        return await SellerRegistration.find().sort({ createdAt: -1 });
    }

    async getRegistrationById(id) {
        const registration = await SellerRegistration.findById(id);
        if (!registration) throw { status: 404, message: 'Registration not found' };
        return registration;
    }

    async updateRegistration(id, data) {
        const updated = await SellerRegistration.findByIdAndUpdate(id, data, { new: true });
        if (!updated) throw { status: 404, message: 'Registration not found' };
        return updated;
    }

    async deleteRegistration(id) {
        const registration = await SellerRegistration.findById(id);
        if (!registration) throw { status: 404, message: 'Registration not found' };
        await registration.deleteOne();
    }

    async getStats() {
        const totalSellers = await SellerRegistration.countDocuments();
        const completedPayments = await SellerRegistration.countDocuments({ paymentStatus: 'Completed' });
        return { totalSellers, completedPayments };
    }
}

module.exports = new SellerRegistrationService();
