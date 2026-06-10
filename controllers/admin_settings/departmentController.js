const departmentService = require('../../services/admin_settings/departmentService');
const { logActivity } = require('../../utils/logger');
class DepartmentController {
    async getAllDepartments(req, res) {
        try {
            const data = await departmentService.getAllDepartments();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Departments fetch error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async createDepartment(req, res) {
        try {
            const { name, description, hodName, status, createdBy } = req.body;
            const data = await departmentService.createDepartment({ name, description, hodName, status }, createdBy || req.user?.username);
            await logActivity(req, 'Created', 'Departments', `Created new department: ${name}`);
            res.status(201).json({ success: true, data, message: 'Department created successfully' });
        } catch (error) {
            console.error('Department creation error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
    async updateDepartment(req, res) {
        try {
            const { name, description, hodName, status, updatedBy } = req.body;
            const data = await departmentService.updateDepartment(req.params.id, { name, description, hodName, status }, updatedBy || req.user?.username);
            await logActivity(req, 'Updated', 'Departments', `Updated department: ${name}`);
            res.json({ success: true, data, message: 'Department updated successfully' });
        } catch (error) {
            console.error('Department update error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
    async deleteDepartment(req, res) {
        try {
            const department = await departmentService.getDepartmentById(req.params.id);
            if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

            await departmentService.deleteDepartment(req.params.id);
            await logActivity(req, 'Deleted', 'Departments', `Deleted department: ${department.name}`);
            res.json({ success: true, message: 'Department deleted successfully' });
        } catch (error) {
            console.error('Department deletion error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}
module.exports = new DepartmentController();