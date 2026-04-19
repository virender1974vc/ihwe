const Otp = require('../models/Otp');
const emailService = require('../utils/emailService');
const whatsapp = require('../utils/whatsapp');

/**
 * Controller for handling OTP generation and verification
 */
class OtpController {
    /**
     * Request OTP for email or phone
     */
    async requestOtp(req, res) {
        try {
            const { identifier, type, name } = req.body; // identifier: email address or phone number

            if (!identifier || !type) {
                return res.status(400).json({ success: false, message: 'Identifier and type are required' });
            }

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Save to DB (expires in 5 mins per schema)
            await Otp.findOneAndUpdate(
                { identifier, type },
                { otp: otpCode, createdAt: new Date() },
                { upsert: true, new: true }
            );

            // Send via appropriate channel
            if (type === 'email') {
                await emailService.sendOtpEmail(identifier, otpCode, name || 'Buyer', 'BUYER');
            } else if (type === 'phone') {
                await whatsapp.sendWhatsAppOTP(identifier, otpCode, 'BUYER');
            }

            res.json({ success: true, message: `OTP sent to ${identifier}` });
        } catch (error) {
            console.error('Error requesting OTP:', error);
            res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }
    }

    /**
     * Verify OTP
     */
    async verifyOtp(req, res) {
        try {
            const { identifier, otp, type } = req.body;

            if (!identifier || !otp || !type) {
                return res.status(400).json({ success: false, message: 'Missing fields' });
            }

            const otpRecord = await Otp.findOne({ identifier, type, otp });

            if (!otpRecord) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }

            // OTP is valid, delete it
            await Otp.deleteOne({ _id: otpRecord._id });

            res.json({ success: true, message: 'OTP verified successfully' });
        } catch (error) {
            console.error('Error verifying OTP:', error);
            res.status(500).json({ success: false, message: 'Verification failed' });
        }
    }
}

module.exports = new OtpController();
