const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

// GET policy by page (Public)
router.get('/:page', policyController.getPolicy);

// UPSERT policy (Admin)
router.post('/', policyController.upsertPolicy);

module.exports = router;
