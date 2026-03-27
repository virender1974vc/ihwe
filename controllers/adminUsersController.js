const adminUsersService = require('../services/adminUsersService');

/**
 * Controller to handle Admin User requests.
 */
class AdminUsersController {
    /**
     * Get all admin users.
     */
    async getAllAdmins(req, res) {
        try {
            const data = await adminUsersService.getAllAdmins();
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

            const data = await adminUsersService.createAdmin(req.body);
            res.status(201).json({ success: true, message: 'Admin created successfully', data });
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
            const data = await adminUsersService.updateAdmin(req.params.id, req.body);
            res.json({ success: true, message: 'Admin updated successfully', data });
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

            await adminUsersService.deleteAdmin(adminId);
            res.json({ success: true, message: 'Admin deleted successfully' });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new AdminUsersController();
