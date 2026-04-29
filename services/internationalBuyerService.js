const InternationalBuyer = require('../models/InternationalBuyer');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

class InternationalBuyerService {
    async getAllRegistrations() {
        return await InternationalBuyer.find().sort({ createdAt: -1 });
    }

    async getRegistrationById(id) {
        return await InternationalBuyer.findById(id);
    }

    async addRegistration(data) {
        // Generate a unique registration ID
        const count = await InternationalBuyer.countDocuments();
        const registrationId = `INTL-BUY-${2026}-${(count + 1).toString().padStart(4, '0')}`;
        
        const registration = new InternationalBuyer({
            ...data,
            registrationId
        });
        const saved = await registration.save();

        // Send Notifications
        this.sendNotifications(saved).catch(err => {
            console.error("Error sending international buyer notifications:", err.message);
        });

        return saved;
    }

    async sendNotifications(saved) {
        // 1. Send Professional Confirmation to User (with QR)
        emailService.sendInternationalBuyerRegistrationEmails(saved).catch(err => {
            console.error("User international email fail:", err.message);
        });

        // 2. Send Detailed Alert to Admin
        emailService.sendDetailedInternationalBuyerNotification(saved).catch(err => {
            console.error("Admin international notification fail:", err.message);
        });
    }

    async updateRegistration(id, data) {
        return await InternationalBuyer.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
        );
    }

    async deleteRegistration(id) {
        return await InternationalBuyer.findByIdAndDelete(id);
    }
}

module.exports = new InternationalBuyerService();
