const rolesService = require('../services/rolesService');
const { logActivity } = require('../utils/logger');

/**
 * Controller to handle Role requests.
 */
class RolesController {
    /**
     * Get all roles.
     */
    async getAllRoles(req, res) {
        try {
            const data = await rolesService.getAllRoles();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Roles fetch error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Create a new role.
     */
    async createRole(req, res) {
        try {
            const { name, description, createdBy } = req.body;
            const data = await rolesService.createRole({ name, description }, createdBy || req.user?.username);
            await logActivity(req, 'Created', 'Roles', `Created new role: ${name}`);
            res.status(201).json({ success: true, data, message: 'Role created successfully' });
        } catch (error) {
            console.error('Role creation error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }

    /**
     * Update an existing role.
     */
    async updateRole(req, res) {
        try {
            const { name, description, permissions, updatedBy } = req.body;
            const data = await rolesService.updateRole(req.params.id, { name, description, permissions }, updatedBy || req.user?.username);
            await logActivity(req, 'Updated', 'Roles', `Updated role: ${name}`);
            res.json({ success: true, data, message: 'Role updated successfully' });
        } catch (error) {
            console.error('Role update error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
    /**
     * Delete a role.
     */
    async deleteRole(req, res) {
        try {
            const role = await rolesService.getRoleById(req.params.id);
            if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
            
            await rolesService.deleteRole(req.params.id);
            await logActivity(req, 'Deleted', 'Roles', `Deleted role: ${role.name}`);
            res.json({ success: true, message: 'Role deleted successfully' });
        } catch (error) {
            console.error('Role deletion error:', error);
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new RolesController();
