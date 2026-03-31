const rolesService = require('../services/rolesService');

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
            res.json(data);
        } catch (error) {
            console.error('Roles fetch error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new RolesController();
