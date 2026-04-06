const authService = require('../services/authService');
const { logActivity } = require('../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Controller to handle Authentication requests.
 */
class AuthController {
    /**
     * Register a new admin.
     */
    async register(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Missing username or password' });
            }

            const data = await authService.register(username, password);
            res.status(201).json({ success: true, message: 'Admin created successfully', user: data });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Login an admin.
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Missing username or password' });
            }

            const data = await authService.login(username, password);
            
            // Log the login activity
            // Since req.user isn't set yet by the middleware, we manually pass a dummy req or ensure logActivity handles it.
            // Actually logActivity uses req.user, so we might need a modified version or set req.user temporarily.
            req.user = { id: data.user.id, username: data.user.username }; 
            await logActivity(req, 'Logged In', 'Auth', `Admin logged in: ${username}`);
            
            res.json({
                success: true,
                message: 'Login successful',
                ...data
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Logout (optional).
     */
    async logout(req, res) {
        res.json({ success: true, message: 'Logged out successfully' });
    }

    /**
     * Verify Token.
     */
    async verifyToken(req, res) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ihwe_secret_2026');
            res.json({ success: true, user: decoded });
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Token expired or invalid' });
        }
    }

    /**
     * Change Password.
     */
    async changePassword(req, res) {
        try {
            const { adminId, currentPassword, newPassword, newUsername } = req.body;

            if (!adminId || !currentPassword) {
                return res.status(400).json({ success: false, message: 'Missing required fields (adminId & currentPassword)' });
            }

            // Security check: only allow users to change their own password (or Super Admin)
            if (req.user.id !== adminId && req.user.role !== 'super-admin') {
                return res.status(403).json({ success: false, message: 'Unauthorized to change this password' });
            }

            if (!newPassword && !newUsername) {
                return res.status(400).json({ success: false, message: 'Provide at least a new password or a new username' });
            }

            const data = await authService.changePassword(adminId, currentPassword, newPassword, newUsername);
            res.json({
                success: true,
                message: 'Credentials updated successfully',
                user: data
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new AuthController();
