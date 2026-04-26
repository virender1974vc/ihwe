const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const { logActivity } = require('../utils/logger');
const addPenalty = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { amount, reason } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Penalty amount must be greater than 0'
            });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Penalty reason is required'
            });
        }

        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Get admin info
        const adminName = req.user?.username || req.user?.name || 'Admin';
        const adminId = req.user?._id;

        // Add to penalty history
        const penaltyEntry = {
            amount: Number(amount),
            reason: reason.trim(),
            addedBy: adminName,
            addedAt: new Date()
        };

        // Update penalty fields
        registration.penaltyAmount = (registration.penaltyAmount || 0) + Number(amount);
        registration.penaltyReason = reason.trim();
        registration.penaltyAddedAt = new Date();
        registration.penaltyAddedBy = adminName;
        registration.penaltyHistory = registration.penaltyHistory || [];
        registration.penaltyHistory.push(penaltyEntry);

        // Recalculate total payable
        registration.totalPayable = (registration.balanceAmount || 0) + registration.penaltyAmount;

        await registration.save();

        // Log activity
        await logActivity(req, 'Updated', 'Exhibitor Bookings', 
            `Added penalty ₹${amount} to ${registration.exhibitorName} (${registration.registrationId}). Reason: ${reason}`
        );

        res.status(200).json({
            success: true,
            message: 'Penalty added successfully',
            data: {
                penaltyAmount: registration.penaltyAmount,
                totalPayable: registration.totalPayable,
                penaltyHistory: registration.penaltyHistory
            }
        });
    } catch (error) {
        console.error('Add Penalty Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add penalty'
        });
    }
};
const updatePenalty = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { amount, reason } = req.body;

        if (amount === undefined || amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Penalty amount is required'
            });
        }

        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        const adminName = req.user?.username || req.user?.name || 'Admin';
        const previousAmount = registration.penaltyAmount || 0;

        // Update penalty
        registration.penaltyAmount = Number(amount);
        registration.penaltyReason = reason || registration.penaltyReason;
        registration.penaltyAddedAt = new Date();
        registration.penaltyAddedBy = adminName;

        // Add to history
        registration.penaltyHistory = registration.penaltyHistory || [];
        registration.penaltyHistory.push({
            amount: Number(amount),
            reason: reason || 'Penalty updated',
            addedBy: adminName,
            addedAt: new Date()
        });
        registration.totalPayable = (registration.balanceAmount || 0) + registration.penaltyAmount;

        await registration.save();

        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Updated penalty from ₹${previousAmount} to ₹${amount} for ${registration.exhibitorName} (${registration.registrationId})`
        );

        res.status(200).json({
            success: true,
            message: 'Penalty updated successfully',
            data: {
                penaltyAmount: registration.penaltyAmount,
                totalPayable: registration.totalPayable
            }
        });
    } catch (error) {
        console.error('Update Penalty Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update penalty'
        });
    }
};
const removePenalty = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { reason } = req.body;

        const registration = await ExhibitorRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        const adminName = req.user?.username || req.user?.name || 'Admin';
        const previousAmount = registration.penaltyAmount || 0;

        // Mark in history as removed
        if (registration.penaltyHistory && registration.penaltyHistory.length > 0) {
            const lastEntry = registration.penaltyHistory[registration.penaltyHistory.length - 1];
            lastEntry.removedAt = new Date();
            lastEntry.removedBy = adminName;
        }

        // Reset penalty
        registration.penaltyAmount = 0;
        registration.penaltyReason = null;
        registration.totalPayable = registration.balanceAmount || 0;

        await registration.save();

        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Removed penalty ₹${previousAmount} from ${registration.exhibitorName} (${registration.registrationId}). ${reason || ''}`
        );

        res.status(200).json({
            success: true,
            message: 'Penalty removed successfully',
            data: {
                penaltyAmount: 0,
                totalPayable: registration.totalPayable
            }
        });
    } catch (error) {
        console.error('Remove Penalty Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove penalty'
        });
    }
};
const getPenaltyHistory = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await ExhibitorRegistration.findById(registrationId)
            .select('penaltyAmount penaltyReason penaltyHistory exhibitorName registrationId');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                exhibitorName: registration.exhibitorName,
                registrationId: registration.registrationId,
                currentPenalty: registration.penaltyAmount || 0,
                penaltyReason: registration.penaltyReason,
                history: registration.penaltyHistory || []
            }
        });
    } catch (error) {
        console.error('Get Penalty History Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get penalty history'
        });
    }
};

module.exports = {
    addPenalty,
    updatePenalty,
    removePenalty,
    getPenaltyHistory
};
