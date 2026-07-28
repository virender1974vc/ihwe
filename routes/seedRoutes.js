const express = require('express');
const router = express.Router();
const { seedMasterData } = require('../controllers/seedMasterDataController');

// GET /api/seed/master-data
router.get('/master-data', seedMasterData);

module.exports = router;
