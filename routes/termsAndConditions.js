const express = require('express');
const router = express.Router();
const termAndConditionController = require('../controllers/termAndConditionController');

router.get('/', termAndConditionController.getAllTerms);
router.get('/:pageName', termAndConditionController.getTermByPage);
router.post('/', termAndConditionController.addTerm);
router.put('/:id', termAndConditionController.updateTerm);
router.delete('/:id', termAndConditionController.deleteTerm);

module.exports = router;
