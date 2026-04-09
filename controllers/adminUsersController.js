const adminUsersService = require('../services/adminUsersService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Admin User requests.
 */
class AdminUsersController {
    /**
     * Get all admin users.
     */
    async getAllAdmins(req, res) {
        try {
            const data = await adminUsersService.getAllAdmins(req.user);
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch admins error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Create a new admin user.
     */
    async createAdmin(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Username and password are required' });
            }

            const data = await adminUsersService.createAdmin(req.body, req.user);
            await logActivity(req, 'Created', 'Admin Management', `Created new admin user: ${username}`);
            res.status(201).json({ success: true, message: 'User created successfully', data });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Update an admin user.
     */
    async updateAdmin(req, res) {
        try {
            const data = await adminUsersService.updateAdmin(req.params.id, req.body, req.user);
            await logActivity(req, 'Updated', 'Admin Management', `Updated admin user: ${req.body.username || data.username}`);
            res.json({ success: true, message: 'User updated successfully', data });
        } catch (error) {
            console.error('Update admin error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Delete an admin user.
     */
    async deleteAdmin(req, res) {
        try {
            const adminId = req.params.id;

            // Prevent self-deletion
            if (req.user && req.user.id === adminId) {
                return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
            }

            const deletedUser = await adminUsersService.deleteAdmin(adminId, req.user);
            await logActivity(req, 'Deleted', 'Admin Management', `Deleted admin user: ${deletedUser.username}`);
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new AdminUsersController();
