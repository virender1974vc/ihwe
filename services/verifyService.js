const Otp = require('../models/Otp');
const { sendEmail } = require('../utils/mailer');
const { sendWhatsAppOTP } = require('../utils/whatsapp');

/**
 * Service to handle Verification (OTP) operations.
 */
class VerifyService {
    /**
     * Helper to generate 6-digit OTP.
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP to email.
     */
    async sendEmailOtp(email, context = 'SPEAKER') {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: email, type: 'email' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        let portalName = "IHWE Portal";
        if (context === 'VISITOR') portalName = "IHWE Visitor Portal";
        if (context === 'EXHIBITOR') portalName = "IHWE Exhibitor Portal";

        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #23471d; margin-top: 0;">${portalName} Verification</h2>
                <p style="color: #555;">Hello,</p>
                <p style="color: #555;">Your One-Time Password (OTP) for registration verification is:</p>
                <div style="font-size: 32px; font-weight: 800; color: #d26019; letter-spacing: 8px; margin: 25px 0; padding: 15px; background: #fffcf9; border: 1px dashed #ffd8b1; text-align: center; border-radius: 8px;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #888; font-size: 12px; margin-bottom: 0;">Best Regards,<br><b>Team IHWE 2026</b><br>Namo Gange Trust</p>
            </div>
        `;

        return await sendEmail(email, `Verification Code - ${portalName}`, html, context);
    }

    /**
     * Verify OTP for email.
     */
    async verifyEmailOtp(email, otp) {
        const record = await Otp.findOne({ identifier: email, otp, type: 'email' });
        if (record) {
            await record.deleteOne();
            return true;
        }
        return false;
    }

    /**
     * Send OTP to phone via WhatsApp.
     */
    async sendPhoneOtp(phone, context = 'CONTACT') {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: phone, type: 'phone' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return await sendWhatsAppOTP(phone, otp, context);
    }

    /**
     * Verify OTP for phone.
     */
    async verifyPhoneOtp(phone, otp) {
        const record = await Otp.findOne({ identifier: phone, otp, type: 'phone' });
        if (record) {
            await record.deleteOne();
            return true;
        }
        return false;
    }
}

module.exports = new VerifyService();
