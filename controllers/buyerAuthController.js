const BuyerRegistration = require('../models/BuyerRegistration');
const mongoose = require('mongoose');
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
            await BuyerRegistration.findByIdAndUpdate(buyer._id, {
                otp,
                otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
            });

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

            await BuyerRegistration.findByIdAndUpdate(buyer._id, {
                $unset: { otp: 1, otpExpiry: 1 }
            });

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
            await BuyerRegistration.findByIdAndUpdate(buyer._id, {
                otp,
                otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
            });

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

    async getMyDashboard(req, res) {
        try {
            if (req.user.role !== 'buyer')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const email = req.user.email;
            const mobile = req.user.mobile;

            const registrations = await BuyerRegistration.find({
                $or: [
                    { emailAddress: email },
                    { mobileNumber: mobile }
                ]
            }).sort({ createdAt: -1 });

            if (!registrations || registrations.length === 0)
                return res.status(404).json({ success: false, message: 'No registrations found' });

            const selectedId = req.query.id;
            let selectedRegistration = null;
            if (selectedId) {
                selectedRegistration = registrations.find(r => (r._id.toString() === selectedId) || (r.registrationId === selectedId));
            }
            if (!selectedRegistration) {
                selectedRegistration = registrations[0];
            }

            res.status(200).json({
                success: true,
                data: selectedRegistration,
                allRegistrations: registrations
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            if (req.user.role !== 'buyer')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword)
                return res.status(400).json({ success: false, message: 'Both current and new password are required' });

            const buyer = await BuyerRegistration.findById(req.user.id).select('+password');
            if (!buyer)
                return res.status(404).json({ success: false, message: 'Buyer not found' });

            // If buyer has no password, they must use registrationId as current password
            const isMatch = buyer.password
                ? await bcrypt.compare(currentPassword, buyer.password)
                : currentPassword === buyer.registrationId;

            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });

            buyer.password = await bcrypt.hash(newPassword, 10);
            await buyer.save();

            res.status(200).json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            if (req.user.role !== 'buyer')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const allowed = [
                'companyName', 'companyFirmName', 'nameOfRepresentative', 'fullName',
                'designation', 'mobileNumber', 'emailAddress', 'gstNumber', 'panNumber',
                'website', 'registeredAddress', 'pinCode', 'pincode', 'city', 'stateProvince', 'state', 'country',
                'businessType', 'basicBusinessType', 'yearOfEstablishment', 'natureOfBusiness',
                'yearsInBusiness', 'numberOfOutlets', 'annualTurnover', 'buyerIndustry',
                'primaryProductInterest', 'secondaryProductCategories', 'specificProductRequirements',
                'importLicense', 'companyProfile'
            ];
            const update = {};
            allowed.forEach(key => {
                if (req.body[key] !== undefined) update[key] = req.body[key];
            });

            // Handle file uploads
            if (req.files) {
                if (req.files.companyProfile) {
                    update.companyProfile = req.files.companyProfile[0].path;
                }
                if (req.files.importLicense) {
                    update.importLicense = req.files.importLicense[0].path;
                }
            }

            const targetId = req.query.id && mongoose.Types.ObjectId.isValid(req.query.id)
                ? req.query.id
                : req.user.id;

            const updated = await BuyerRegistration.findByIdAndUpdate(
                targetId,
                { $set: update },
                { new: true, runValidators: false }
            );

            if (!updated)
                return res.status(404).json({ success: false, message: 'Buyer not found' });

            res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BuyerAuthController();
