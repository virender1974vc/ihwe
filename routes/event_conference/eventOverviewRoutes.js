const express = require('express');
const router = express.Router();
const eventOverviewController = require('../../controllers/event_conference/eventOverviewController');

router.get('/', eventOverviewController.getEventOverview);
router.post('/update', eventOverviewController.updateEventOverview);

module.exports = router;
