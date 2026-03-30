const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

class ExhibitorAuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ success: false, message: 'Email and password are required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 'contact1.email': email })
                .sort({ createdAt: -1 })
                .select('+password');

            if (!exhibitor)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, exhibitor.password || '');
            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Invalid credentials' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            // Send OTP via email with proper template
            await emailService.sendOtpEmail(email, otp, exhibitor.exhibitorName);

            res.status(200).json({
                success: true,
                message: 'OTP sent to registered email',
                requiresOtp: true,
                exhibitorId: exhibitor._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { exhibitorId, otp } = req.body;
            if (!exhibitorId || !otp)
                return res.status(400).json({ success: false, message: 'Exhibitor ID and OTP are required' });

            const exhibitor = await ExhibitorRegistration.findById(exhibitorId).select('+otp +otpExpiry');
            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            if (!exhibitor.otp || exhibitor.otp !== otp)
                return res.status(401).json({ success: false, message: 'Invalid OTP' });

            if (new Date() > exhibitor.otpExpiry)
                return res.status(401).json({ success: false, message: 'OTP has expired. Please log in again.' });

            exhibitor.otp = undefined;
            exhibitor.otpExpiry = undefined;
            await exhibitor.save();

            const token = jwt.sign(
                { id: exhibitor._id, role: 'exhibitor', email: exhibitor.contact1.email, mobile: exhibitor.contact1.mobile, exhibitorName: exhibitor.exhibitorName },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '7d' }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                exhibitor: { id: exhibitor._id, exhibitorName: exhibitor.exhibitorName, email: exhibitor.contact1.email }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Send OTP to mobile
    async sendMobileOtp(req, res) {
        try {
            const { mobile } = req.body;
            if (!mobile)
                return res.status(400).json({ success: false, message: 'Mobile number is required' });

            const exhibitor = await ExhibitorRegistration.findOne({ 'contact1.mobile': mobile })
                .sort({ createdAt: -1 });

            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor with this mobile number not found' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            exhibitor.otp = otp;
            exhibitor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await exhibitor.save();

            // Try sending via WhatsApp if available
            const { sendWhatsAppOTP } = require('../utils/whatsapp');
            await sendWhatsAppOTP(mobile, otp);
            
            // Also send via email if exists
            if (exhibitor.contact1.email) {
                await emailService.sendOtpEmail(exhibitor.contact1.email, otp, exhibitor.exhibitorName);
            }

            res.status(200).json({
                success: true,
                message: 'OTP sent to mobile & email',
                exhibitorId: exhibitor._id
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getMyDashboard(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied. Exhibitors only.' });

            // Find all registrations for this user by email OR mobile
            const email = req.user.email;
            const mobile = req.user.mobile;

            const registrations = await ExhibitorRegistration.find({
                $or: [
                    { 'contact1.email': email },
                    { 'contact1.mobile': mobile }
                ]
            })
            .populate('eventId', 'name date location venue startDate endDate')
            .sort({ createdAt: -1 });

            if (!registrations || registrations.length === 0)
                return res.status(404).json({ success: false, message: 'No registrations found' });

            // If an ID is provided in query, return that specific one
            const selectedId = req.query.id;
            let selectedRegistration = null;
            if (selectedId) {
                selectedRegistration = registrations.find(r => r._id.toString() === selectedId);
            }

            // Default to latest if not specified or not found
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

    // Change password from dashboard
    async changePassword(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied.' });

            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword)
                return res.status(400).json({ success: false, message: 'Both current and new password are required' });

            if (newPassword.length < 6)
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

            const exhibitor = await ExhibitorRegistration.findById(req.user.id).select('+password');
            if (!exhibitor)
                return res.status(404).json({ success: false, message: 'Exhibitor not found' });

            const isMatch = await bcrypt.compare(currentPassword, exhibitor.password || '');
            if (!isMatch)
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });

            exhibitor.password = await bcrypt.hash(newPassword, 10);
            await exhibitor.save();

            res.status(200).json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ExhibitorAuthController();
