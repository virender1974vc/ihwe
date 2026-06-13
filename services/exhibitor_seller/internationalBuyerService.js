const InternationalBuyer = require('../../models/exhibitor_seller/InternationalBuyer');
const emailService = require('../../utils/emailService');
const whatsapp = require('../../utils/whatsapp');
const qrcode = require('qrcode');

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

        let qrCodeDataURI = '';
        try {
            qrCodeDataURI = await qrcode.toDataURL(registrationId, {
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 200,
                color: { dark: '#000000', light: '#ffffff' }
            });
        } catch (err) {
            console.error("QR Code Generation failed:", err.message);
        }

        const registration = new InternationalBuyer({
            ...data,
            registrationId,
            qrCode: qrCodeDataURI
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
            { returnDocument: 'after' }
        );
    }

    async deleteRegistration(id) {
        return await InternationalBuyer.findByIdAndDelete(id);
    }
}

module.exports = new InternationalBuyerService();
