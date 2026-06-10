const express = require('express');
const router = express.Router();
const brochureLeadController = require('../../controllers/crm/brochureLeadController');

router.post('/submit', brochureLeadController.createLead);
router.get('/all', brochureLeadController.getAllLeads);

module.exports = router;
