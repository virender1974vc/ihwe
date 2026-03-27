const verifyService = require('../services/verifyService');

/**
 * Controller to handle Verification requests.
 */
class VerifyController {
    /**
     * Send OTP to email.
     */
    async sendEmailOtp(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

            const result = await verifyService.sendEmailOtp(email);
            
            if (result.success) {
                res.json({ success: true, message: 'OTP sent to email' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to send email' });
            }
        } catch (err) {
            console.error('Send Email OTP Error:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Verify OTP for email.
     */
    async verifyEmailOtp(req, res) {
        try {
            const { email, otp } = req.body;
            const success = await verifyService.verifyEmailOtp(email, otp);
            
            if (success) {
                res.json({ success: true, message: 'Email verified successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }
        } catch (err) {
            console.error('Verify Email OTP Error:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Send OTP to phone via WhatsApp.
     */
    async sendPhoneOtp(req, res) {
        try {
            const { phone } = req.body;
            if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

            const result = await verifyService.sendPhoneOtp(phone);
            
            if (result.success) {
                res.json({ success: true, message: 'OTP sent to WhatsApp' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to send WhatsApp message' });
            }
        } catch (err) {
            console.error('Send Phone OTP Error:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    /**
     * Verify OTP for phone.
     */
    async verifyPhoneOtp(req, res) {
        try {
            const { phone, otp } = req.body;
            const success = await verifyService.verifyPhoneOtp(phone, otp);
            
            if (success) {
                res.json({ success: true, message: 'Phone verified successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }
        } catch (err) {
            console.error('Verify Phone OTP Error:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}

module.exports = new VerifyController();
