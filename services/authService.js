const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Service to handle Authentication operations.
 */
class AuthService {
    /**
     * Register a new admin user.
     */
    async register(username, password) {
        const existingUser = await User.findOne({ username });
        if (existingUser) throw { status: 409, message: 'User already exists' };

        const newUser = new User({ username, password, role: 'IHWE–Super Administrator' });
        await newUser.save();
        return { username: newUser.username };
    }

    /**
     * Login an admin user.
     */
    async login(username, password) {
        const user = await User.findOne({ username });
        if (!user) throw { status: 401, message: 'Invalid credentials' };

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'ihwe_secret_2026',
            { expiresIn: '24h' }
        );

        // Update lastLogin
        user.lastLogin = new Date();
        await user.save();

        return {
            token,
            admin: {
                _id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName || '',
                mobile: user.mobile || '',
                department: user.department || '',
                profileImage: user.profileImage || ''
            }
        };
    }

    /**
     * Change admin credentials.
     */
    async changePassword(adminId, currentPassword, newPassword, newUsername) {
        const user = await User.findById(adminId);
        if (!user) throw { status: 404, message: 'Admin not found' };

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw { status: 400, message: 'Invalid current password' };

        if (newUsername) {
            const existingUser = await User.findOne({ username: newUsername });
            if (existingUser && existingUser._id.toString() !== adminId) {
                throw { status: 409, message: 'Username already taken' };
            }
            user.username = newUsername;
        }

        if (newPassword) {
            user.password = newPassword;
        }

        await user.save();
        return { username: user.username };
    }
    async sendChangePasswordOtp(adminId) {
        const user = await User.findById(adminId);
        if (!user) throw { status: 404, message: 'Admin not found' };
        if (!user.mobile) throw { status: 400, message: 'No mobile number associated with this account. Please update your profile.' };

        const { generateOtp, sendOtpWhatsapp } = require('../utils/otpService');
        const Otp = require('../models/Otp');

        const otp = generateOtp();
        await Otp.deleteMany({ identifier: user.mobile, type: 'phone' });

        await Otp.create({
            identifier: user.mobile,
            otp: otp,
            type: 'phone'
        });

        await sendOtpWhatsapp(user.mobile, otp);
        return true;
    }
    async changePasswordWithOtp(adminId, otp, newPassword, newUsername) {
        const user = await User.findById(adminId);
        if (!user) throw { status: 404, message: 'Admin not found' };
        if (!user.mobile) throw { status: 400, message: 'No mobile number associated with this account.' };

        const Otp = require('../models/Otp');
        const otpRecord = await Otp.findOne({ identifier: user.mobile, otp: otp, type: 'phone' });
        if (!otpRecord) throw { status: 400, message: 'Invalid or expired OTP' };
        await Otp.deleteOne({ _id: otpRecord._id });

        if (newUsername) {
            const existingUser = await User.findOne({ username: newUsername });
            if (existingUser && existingUser._id.toString() !== adminId) {
                throw { status: 409, message: 'Username already taken' };
            }
            user.username = newUsername;
        }

        if (newPassword) {
            user.password = newPassword;
        }

        await user.save();
        return { username: user.username };
    }
}

module.exports = new AuthService();
