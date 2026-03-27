const User = require('../models/User');

/**
 * Service to handle Admin User operations.
 */
class AdminUsersService {
    /**
     * Get all admin users.
     */
    async getAllAdmins() {
        return await User.find().select('-password').sort({ createdAt: 1 });
    }

    /**
     * Create a new admin user.
     */
    async createAdmin(data) {
        const { username, password, role } = data;

        const existingUser = await User.findOne({ username });
        if (existingUser) throw { status: 409, message: 'Username already exists' };

        const newAdmin = new User({
            username,
            password,
            role: role || 'Editor',
            status: 'Active'
        });

        await newAdmin.save();
        const adminData = newAdmin.toObject();
        delete adminData.password;
        return adminData;
    }

    /**
     * Update an admin user.
     */
    async updateAdmin(id, data) {
        const { username, role, status, password } = data;

        const admin = await User.findById(id);
        if (!admin) throw { status: 404, message: 'Admin not found' };

        if (username && username !== admin.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) throw { status: 409, message: 'Username already exists' };
            admin.username = username;
        }

        if (role) admin.role = role;
        if (status) admin.status = status;
        if (password) admin.password = password;

        await admin.save();
        const adminData = admin.toObject();
        delete adminData.password;
        return adminData;
    }

    /**
     * Delete an admin user.
     */
    async deleteAdmin(id) {
        const admin = await User.findByIdAndDelete(id);
        if (!admin) throw { status: 404, message: 'Admin not found' };
        return admin;
    }
}

module.exports = new AdminUsersService();
