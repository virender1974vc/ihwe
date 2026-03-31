const express = require('express');
const router = express.Router();
const sidebarController = require('../controllers/sidebarController');

// GET /api/sidebar - get full sidebar tree
router.get('/', (req, res) => sidebarController.getSidebarTree(req, res));

// POST /api/sidebar - create sidebar item (admin use)
router.post('/', (req, res) => sidebarController.createItem(req, res));

module.exports = router;
