const User = require('../models/User');

/**
 * Service to handle Admin User operations.
 */
class AdminUsersService {
    /**
     * Get users based on requester's role.
     */
    async getAllAdmins(requester) {
        let filter = {};
        if (requester.role !== 'super-admin') {
            filter = { createdBy: requester.id };
        }
        return await User.find(filter)
            .select('-password')
            .populate('createdBy', 'username role') // Optional: see who created whom
            .sort({ createdAt: 1 });
    }

    /**
     * Create a new user with permission checks.
     */
    async createAdmin(data, requester) {
        const { username, password, role, fullName, designation, email, mobile, altMobile } = data;

        if (requester.role !== 'super-admin') {
            if (role && role !== 'employee') {
                throw { status: 403, message: 'You only have permission to create employees' };
            }
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) throw { status: 409, message: 'Username already exists' };

        const newUser = new User({
            username, password,
            fullName: fullName || '',
            designation: designation || '',
            email: email || '',
            mobile: mobile || '',
            altMobile: altMobile || '',
            role: role || 'employee',
            status: 'Active',
            createdBy: requester.id
        });

        await newUser.save();
        const userData = newUser.toObject();
        delete userData.password;
        return userData;
    }

    /**
     * Update a user with permission checks.
     */
    async updateAdmin(id, data, requester) {
        const { username, role, status, password, fullName, designation, email, mobile, altMobile } = data;

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) throw { status: 404, message: 'User not found' };

        if (requester.role !== 'super-admin' && userToUpdate.createdBy?.toString() !== requester.id) {
            throw { status: 403, message: 'Unauthorized to update this user' };
        }

        if (username && username !== userToUpdate.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) throw { status: 409, message: 'Username already exists' };
            userToUpdate.username = username;
        }

        if (role) {
            if (requester.role !== 'super-admin' && role !== 'employee') {
                throw { status: 403, message: 'Cannot assign non-employee roles' };
            }
            userToUpdate.role = role;
        }

        if (status) userToUpdate.status = status;
        if (password) userToUpdate.password = password;
        if (fullName !== undefined) userToUpdate.fullName = fullName;
        if (designation !== undefined) userToUpdate.designation = designation;
        if (email !== undefined) userToUpdate.email = email;
        if (mobile !== undefined) userToUpdate.mobile = mobile;
        if (altMobile !== undefined) userToUpdate.altMobile = altMobile;

        await userToUpdate.save();
        const userData = userToUpdate.toObject();
        delete userData.password;
        return userData;
    }

    /**
     * Delete a user with permission checks.
     */
    async deleteAdmin(id, requester) {
        const userToDelete = await User.findById(id);
        if (!userToDelete) throw { status: 404, message: 'User not found' };

        // Permission check
        if (requester.role !== 'super-admin' && userToDelete.createdBy?.toString() !== requester.id) {
            throw { status: 403, message: 'Unauthorized to delete this user' };
        }

        const deleted = await User.findByIdAndDelete(id);
        return deleted;
    }
}

module.exports = new AdminUsersService();
