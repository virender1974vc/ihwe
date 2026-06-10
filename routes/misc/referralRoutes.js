const express = require('express');
const router = express.Router();
const referralController = require('../../controllers/misc/referralController');

// @route   POST /api/referrals
// @desc    Submit a new referral
router.post('/', referralController.createReferral);

// @route   GET /api/referrals
// @desc    Get all referrals
router.get('/', referralController.getReferrals);

// @route   DELETE /api/referrals/:id
// @desc    Delete a referral
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
