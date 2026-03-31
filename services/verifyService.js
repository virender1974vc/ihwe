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
    async sendEmailOtp(email) {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: email, type: 'email' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #23471d;">Contact Verification</h2>
                <p>Hello,</p>
                <p>Your OTP for IHWE contact verification is:</p>
                <div style="font-size: 24px; font-weight: bold; color: #d26019; letter-spacing: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
                <p>Best Regards,<br>Team IHWE</p>
            </div>
        `;

        return await sendEmail(email, 'Your IHWE Verification Code', html);
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
    async sendPhoneOtp(phone) {
        const otp = this.generateOTP();
        
        await Otp.findOneAndUpdate(
            { identifier: phone, type: 'phone' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return await sendWhatsAppOTP(phone, otp);
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
