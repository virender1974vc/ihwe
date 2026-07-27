const express = require('express');
const router = express.Router();
const ourJourneyController = require('../controllers/ourJourneyController');
const { verifyToken } = require('../utils/verifyToken');

router.get('/', ourJourneyController.getOurJourney);
router.post('/update', verifyToken, ourJourneyController.updateOurJourney);

module.exports = router;
