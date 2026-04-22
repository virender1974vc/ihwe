const BuyerRegistration = require('../models/BuyerRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

class BuyerAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const buyer = await BuyerRegistration.findOne({ emailAddress: email.trim().toLowerCase() })
                .sort({ createdAt: -1 })
                .select('+password');

            if (!buyer)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            // Using registrationId as password if password is not set
            const isMatch = buyer.password
                ? await bcrypt.compare(password, buyer.password)
                : password === buyer.registrationId;

            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            buyer.otp = otp;
            buyer.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await buyer.save();

            // Send OTP via email
            await emailService.sendOtpEmail(email, otp, buyer.companyName);

            res.status(200).json({
                success: true,
                message: 'OTP sent to registered email',
                requiresOtp: true,
                buyerId: buyer._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { buyerId, otp } = req.body;
            if (!buyerId || !otp)
                return res.status(400).json({ success: false, message: 'Buyer ID and OTP are required' });

            const buyer = await BuyerRegistration.findById(buyerId).select('+otp +otpExpiry');
            if (!buyer)
                return res.status(404).json({ success: false, message: 'Buyer not found' });

            if (!buyer.otp || buyer.otp !== otp)
                return res.status(401).json({ success: false, message: 'Invalid OTP' });

            if (new Date() > buyer.otpExpiry)
                return res.status(401).json({ success: false, message: 'OTP has expired. Please log in again.' });

            buyer.otp = undefined;
            buyer.otpExpiry = undefined;
            await buyer.save();

            const token = jwt.sign(
                { id: buyer._id, role: 'buyer', email: buyer.emailAddress, mobile: buyer.mobileNumber, name: buyer.companyName },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '7d' }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                buyer: { id: buyer._id, name: buyer.companyName, email: buyer.emailAddress }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async sendMobileOtp(req, res) {
        try {
            const { mobile } = req.body;
            if (!mobile)
                return res.status(400).json({ success: false, message: 'Mobile number is required' });

            const buyer = await BuyerRegistration.findOne({ mobileNumber: mobile.trim() })
                .sort({ createdAt: -1 });

            if (!buyer)
                return res.status(404).json({ success: false, message: 'Buyer with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            buyer.otp = otp;
            buyer.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await buyer.save();

            // Try sending via WhatsApp if available
            try {
                const { sendWhatsAppOTP } = require('../utils/whatsapp');
                await sendWhatsAppOTP(mobile, otp, 'BUYER', buyer.companyName);
            } catch (waError) {
                console.error("WhatsApp OTP failed:", waError.message);
            }

            // Also send via email
            if (buyer.emailAddress) {
                await emailService.sendOtpEmail(buyer.emailAddress, otp, buyer.companyName);
            }

            res.status(200).json({
                success: true,
                message: 'OTP sent to mobile & email',
                buyerId: buyer._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BuyerAuthController();
