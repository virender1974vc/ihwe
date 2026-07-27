const Role = require('../models/Role');
const User = require('../models/User');
class RolesService {
    async getAllRoles() {
        const roles = await Role.find().sort({ createdAt: -1 }).lean();
        const users = await User.find({}, 'username fullName').lean();

        const userMap = {};
        users.forEach(u => {
            if (u.username) userMap[u.username] = u.fullName || u.username;
        });

        return roles.map(role => ({
            ...role,
            status: role.status || 'Active',
            createdBy: userMap[role.createdBy] || role.createdBy,
            updatedBy: userMap[role.updatedBy] || role.updatedBy
        }));
    }
    async getRoleById(id) {
        return await Role.findById(id);
    }
    async createRole(data, username) {
        const role = new Role({
            ...data,
            createdBy: username || 'System',
            updatedBy: username || 'System'
        });
        return await role.save();
    }
    async updateRole(id, data, username) {
        const oldRole = await Role.findById(id);
        const updatedRole = await Role.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedBy: username || 'System'
            },
            { returnDocument: 'after' }
        );
        if (oldRole && data.name && oldRole.name !== data.name) {
            const User = require('../models/User');
            await User.updateMany({ role: oldRole.name }, { role: data.name });
            console.log(`Updated users with role "${oldRole.name}" to "${data.name}"`);
        }

        return updatedRole;
    }
    async deleteRole(id) {
        const role = await Role.findById(id);
        if (!role) throw new Error('Role not found');
        return await Role.findByIdAndDelete(id);
    }
}
module.exports = new RolesService();