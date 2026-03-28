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
                { id: exhibitor._id, role: 'exhibitor', email: exhibitor.contact1.email, exhibitorName: exhibitor.exhibitorName },
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

    async getMyDashboard(req, res) {
        try {
            if (req.user.role !== 'exhibitor')
                return res.status(403).json({ success: false, message: 'Access denied. Exhibitors only.' });

            const registration = await ExhibitorRegistration.findById(req.user.id)
                .populate('eventId', 'name date location venue');

            if (!registration)
                return res.status(404).json({ success: false, message: 'Registration not found' });

            res.status(200).json({ success: true, data: registration });
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
