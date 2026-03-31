const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

// For now, return empty roles list
router.get('/', (req, res) => rolesController.getAllRoles(req, res));

module.exports = router;
