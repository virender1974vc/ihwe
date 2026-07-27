const Designation = require('../models/Designation');
const User = require('../models/User');

class DesignationService {
    async getAllDesignations() {
        const designations = await Designation.find()
            .populate('department', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const users = await User.find({}, 'username fullName').lean();

        const userMap = {};
        users.forEach(u => {
            if (u.username) userMap[u.username] = u.fullName || u.username;
        });

        return designations.map(desig => ({
            ...desig,
            status: desig.status || 'Active',
            createdBy: userMap[desig.createdBy] || desig.createdBy,
            updatedBy: userMap[desig.updatedBy] || desig.updatedBy
        }));
    }

    async getDesignationById(id) {
        return await Designation.findById(id).populate('department', 'name');
    }

    async createDesignation(data, username) {
        const designation = new Designation({
            ...data,
            createdBy: username || 'System',
            updatedBy: username || 'System'
        });
        return await designation.save();
    }

    async updateDesignation(id, data, username) {
        const updatedDesignation = await Designation.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedBy: username || 'System'
            },
            { returnDocument: 'after' }
        );
        return updatedDesignation;
    }

    async deleteDesignation(id) {
        return await Designation.findByIdAndDelete(id);
    }
}

module.exports = new DesignationService();
