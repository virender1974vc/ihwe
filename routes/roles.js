const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

// All role management routes
router.get('/', (req, res) => rolesController.getAllRoles(req, res));
router.post('/create', (req, res) => rolesController.createRole(req, res));
router.put('/update/:id', (req, res) => rolesController.updateRole(req, res));
router.delete('/delete/:id', (req, res) => rolesController.deleteRole(req, res));

module.exports = router;

