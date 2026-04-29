const SellerRegistration = require('../models/SellerRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

class SellerAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const seller = await SellerRegistration.findOne({ emailAddress: email.trim().toLowerCase() })
                .sort({ createdAt: -1 })
                .select('+password');

            if (!seller)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            // Using registrationId as password if password is not set
            const isMatch = seller.password
                ? await bcrypt.compare(password, seller.password)
                : password === seller.registrationId;

            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await SellerRegistration.findByIdAndUpdate(seller._id, {
                otp,
                otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
            });

            // Send OTP via email
            await emailService.sendOtpEmail(email, otp, seller.companyName);

            res.status(200).json({
                success: true,
                message: 'OTP sent to registered email',
                requiresOtp: true,
                sellerId: seller._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { sellerId, otp } = req.body;
            if (!sellerId || !otp)
                return res.status(400).json({ success: false, message: 'Seller ID and OTP are required' });

            const seller = await SellerRegistration.findById(sellerId).select('+otp +otpExpiry');
            if (!seller)
                return res.status(404).json({ success: false, message: 'Seller not found' });

            if (!seller.otp || seller.otp !== otp)
                return res.status(401).json({ success: false, message: 'Invalid OTP' });

            if (new Date() > seller.otpExpiry)
                return res.status(401).json({ success: false, message: 'OTP has expired. Please log in again.' });

            await SellerRegistration.findByIdAndUpdate(seller._id, {
                $unset: { otp: 1, otpExpiry: 1 }
            });

            const token = jwt.sign(
                { id: seller._id, role: 'seller', email: seller.emailAddress, mobile: seller.mobileNumber, name: seller.companyName },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '7d' }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                seller: { id: seller._id, name: seller.companyName, email: seller.emailAddress }
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

            const seller = await SellerRegistration.findOne({ mobileNumber: mobile.trim() })
                .sort({ createdAt: -1 });

            if (!seller)
                return res.status(404).json({ success: false, message: 'Seller with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await SellerRegistration.findByIdAndUpdate(seller._id, {
                otp,
                otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
            });

            // Try sending via WhatsApp if available
            try {
                const { sendWhatsAppOTP } = require('../utils/whatsapp');
                await sendWhatsAppOTP(mobile, otp, 'SELLER', seller.companyName);
            } catch (waError) {
                console.error("WhatsApp OTP failed:", waError.message);
            }

            // Also send via email
            if (seller.emailAddress) {
                await emailService.sendOtpEmail(seller.emailAddress, otp, seller.companyName);
            }

            res.status(200).json({
                success: true,
                message: 'OTP sent to mobile & email',
                sellerId: seller._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new SellerAuthController();
