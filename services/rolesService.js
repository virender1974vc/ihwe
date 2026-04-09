const Role = require('../models/Role');

/**
 * Service to handle Role operations.
 */
class RolesService {
    /**
     * Get all roles.
     */
    async getAllRoles() {
        return await Role.find().sort({ createdAt: -1 });
    }

    /**
     * Get a single role by ID.
     */
    async getRoleById(id) {
        return await Role.findById(id);
    }

    /**
     * Create a new role.
     */
    async createRole(data, username) {
        const role = new Role({
            ...data,
            createdBy: username || 'System',
            updatedBy: username || 'System'
        });
        return await role.save();
    }

    /**
     * Update an existing role.
     */
    async updateRole(id, data, username) {
        const oldRole = await Role.findById(id);
        const updatedRole = await Role.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedBy: username || 'System'
            },
            { new: true }
        );

        // If the role exists and its name was changed, update all Users using the old name
        if (oldRole && data.name && oldRole.name !== data.name) {
            const User = require('../models/User'); // Import here to avoid circular dependency
            await User.updateMany({ role: oldRole.name }, { role: data.name });
            console.log(`Updated users with role "${oldRole.name}" to "${data.name}"`);
        }

        return updatedRole;
    }

    /**
     * Delete a role.
     */
    async deleteRole(id) {
        const role = await Role.findById(id);
        if (!role) throw new Error('Role not found');

        // All roles are now deletable as per user request
        return await Role.findByIdAndDelete(id);
    }
}

module.exports = new RolesService();

