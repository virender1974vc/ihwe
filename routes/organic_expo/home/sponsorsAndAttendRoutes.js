const express = require('express');
const router = express.Router();
const sponsorsAndAttendController = require('../../../controllers/organic_expo/home/sponsorsAndAttendController');

// @route   GET /api/organic/sponsors-and-attend
router.get('/', (req, res) => sponsorsAndAttendController.getSponsorsAndAttend(req, res));

// @route   POST /api/organic/sponsors-and-attend
router.post('/', (req, res) => sponsorsAndAttendController.updateSponsorsAndAttend(req, res));

module.exports = router;
