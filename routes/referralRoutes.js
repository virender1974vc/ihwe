const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');

// @route   POST /api/referrals
// @desc    Submit a new referral
router.post('/', referralController.createReferral);

// @route   GET /api/referrals
// @desc    Get all referrals
router.get('/', referralController.getReferrals);

// @route   GET /api/referrals/:id
router.get('/:id', referralController.getReferralById);

// @route   DELETE /api/referrals/:id
// @desc    Delete a referral
router.delete('/:id', referralController.deleteReferral);

// @route   PUT /api/referrals/:id
// @desc    Update a referral
router.put('/:id', referralController.updateReferral);

module.exports = router;
