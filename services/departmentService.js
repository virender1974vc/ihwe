const Department = require('../models/Department');
const User = require('../models/User');
class DepartmentService {
    async getAllDepartments() {
        const departments = await Department.find().sort({ createdAt: -1 }).lean();
        const users = await User.find({}, 'username fullName').lean();
        
        const userMap = {};
        users.forEach(u => {
            if (u.username) userMap[u.username] = u.fullName || u.username;
        });

        return departments.map(dep => ({
            ...dep,
            status: dep.status || 'Active',
            createdBy: userMap[dep.createdBy] || dep.createdBy,
            updatedBy: userMap[dep.updatedBy] || dep.updatedBy
        }));
    }
    async getDepartmentById(id) {
        return await Department.findById(id);
    }
    async createDepartment(data, username) {
        const department = new Department({
            ...data,
            createdBy: username || 'System',
            updatedBy: username || 'System'
        });
        return await department.save();
    }
    async updateDepartment(id, data, username) {
        const updatedDepartment = await Department.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedBy: username || 'System'
            },
            { returnDocument: 'after' }
        );

        return updatedDepartment;
    }
    async deleteDepartment(id) {
        const department = await Department.findById(id);
        if (!department) throw new Error('Department not found');

        return await Department.findByIdAndDelete(id);
    }
}
module.exports = new DepartmentService();