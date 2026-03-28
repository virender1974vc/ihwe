const express = require('express');
const router = express.Router();
const stallRateController = require('../controllers/stallRateController');

router.get('/', stallRateController.getAllRates);
router.get('/event/:eventId', stallRateController.getStoreRates);
router.get('/find', stallRateController.getRate);
router.post('/', stallRateController.addRate);
router.delete('/:id', stallRateController.deleteRate);

module.exports = router;
