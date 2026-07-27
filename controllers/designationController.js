const designationService = require('../services/designationService');

class DesignationController {
    async getAllDesignations(req, res) {
        try {
            const data = await designationService.getAllDesignations();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error fetching designations:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async createDesignation(req, res) {
        try {
            const { name, department, reportTo, status, createdBy } = req.body;
            
            if (!name || !department) {
                return res.status(400).json({ success: false, message: 'Designation name and department are required' });
            }

            const data = await designationService.createDesignation({ name, department, reportTo, status }, createdBy || req.user?.username);
            res.status(201).json({ success: true, message: 'Designation created successfully', data });
        } catch (error) {
            console.error('Error creating designation:', error);
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: 'Designation already exists' });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateDesignation(req, res) {
        try {
            const { id } = req.params;
            const { name, department, reportTo, status, updatedBy } = req.body;
            
            if (!name || !department) {
                return res.status(400).json({ success: false, message: 'Designation name and department are required' });
            }

            const data = await designationService.updateDesignation(id, { name, department, reportTo, status }, updatedBy || req.user?.username);
            
            if (!data) {
                return res.status(404).json({ success: false, message: 'Designation not found' });
            }
            
            res.json({ success: true, message: 'Designation updated successfully', data });
        } catch (error) {
            console.error('Error updating designation:', error);
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: 'Designation already exists' });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async deleteDesignation(req, res) {
        try {
            const { id } = req.params;
            const data = await designationService.deleteDesignation(id);
            
            if (!data) {
                return res.status(404).json({ success: false, message: 'Designation not found' });
            }
            
            res.json({ success: true, message: 'Designation deleted successfully' });
        } catch (error) {
            console.error('Error deleting designation:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new DesignationController();
