const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const { logActivity } = require('../utils/logger');
const emailService = require('../utils/emailService');
const whatsappService = require('../utils/whatsappService');
const getOverduePayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', daysOverdue = 'all' } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const query = {
            status: { $in: ['pending', 'advance-paid'] },
            balanceAmount: { $gt: 0 },
            paymentDueDate: { $lt: today }
        };
        if (search) {
            query.$or = [
                { exhibitorName: { $regex: search, $options: 'i' } },
                { registrationId: { $regex: search, $options: 'i' } },
                { 'contact1.email': { $regex: search, $options: 'i' } },
                { 'contact1.mobile': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const registrations = await ExhibitorRegistration.find(query)
            .populate('eventId', 'name startDate endDate')
            .sort({ paymentDueDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ExhibitorRegistration.countDocuments(query);
        const overdueList = registrations.map(reg => {
            const dueDate = reg.paymentDueDate ? new Date(reg.paymentDueDate) : null;
            const daysOverdue = dueDate ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;

            return {
                _id: reg._id,
                registrationId: reg.registrationId,
                exhibitorName: reg.exhibitorName,
                contact1: reg.contact1,
                event: reg.eventId,
                participation: reg.participation,
                balanceAmount: reg.balanceAmount,
                penaltyAmount: reg.penaltyAmount || 0,
                totalPayable: reg.totalPayable || reg.balanceAmount,
                paymentDueDate: reg.paymentDueDate,
                daysOverdue,
                warningCount: reg.warningCount || 0,
                lastWarningSentAt: reg.lastWarningSentAt,
                status: reg.status
            };
        });
        let filteredList = overdueList;
        if (daysOverdue !== 'all') {
            const days = parseInt(daysOverdue);
            if (days === 7) {
                filteredList = overdueList.filter(r => r.daysOverdue <= 7);
            } else if (days === 14) {
                filteredList = overdueList.filter(r => r.daysOverdue > 7 && r.daysOverdue <= 14);
            } else if (days === 30) {
                filteredList = overdueList.filter(r => r.daysOverdue > 14 && r.daysOverdue <= 30);
            } else if (days === 30) {
                filteredList = overdueList.filter(r => r.daysOverdue > 30);
            }
        }

        // Calculate stats
        const stats = await ExhibitorRegistration.aggregate([
            {
                $match: {
                    status: { $in: ['pending', 'advance-paid'] },
                    balanceAmount: { $gt: 0 },
                    paymentDueDate: { $lt: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOverdue: { $sum: 1 },
                    totalAmount: { $sum: '$balanceAmount' },
                    totalPenalty: { $sum: { $ifNull: ['$penaltyAmount', 0] } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: filteredList,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats[0] || { totalOverdue: 0, totalAmount: 0, totalPenalty: 0 }
        });
    } catch (error) {
        console.error('Get Overdue Payments Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get overdue payments'
        });
    }
};
const sendWarning = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { type = 'both', customMessage } = req.body;

        const registration = await ExhibitorRegistration.findById(registrationId)
            .populate('eventId', 'name');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        const today = new Date();
        const dueDate = registration.paymentDueDate ? new Date(registration.paymentDueDate) : null;
        const daysOverdue = dueDate ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;

        const adminName = req.user?.username || req.user?.name || 'Admin';

        // Prepare template data
        const templateData = {
            exhibitorName: registration.exhibitorName,
            contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
            eventName: registration.eventId?.name || 'Exhibition',
            registrationId: registration.registrationId,
            stallNo: registration.participation?.stallNo || 'N/A',
            stallType: registration.participation?.stallType || 'N/A',
            originalAmount: registration.financeBreakdown?.netPayable || registration.participation?.total || 0,
            amountPaid: registration.amountPaid || 0,
            balanceAmount: registration.balanceAmount || 0,
            penaltyAmount: registration.penaltyAmount || 0,
            totalPayable: registration.totalPayable || registration.balanceAmount || 0,
            dueDate: dueDate ? dueDate.toLocaleDateString('en-IN') : 'N/A',
            daysOverdue,
            paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor/payment/${registration._id}`,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@exhibition.com',
            supportPhone: process.env.SUPPORT_PHONE || '+91 9876543210',
            companyName: process.env.COMPANY_NAME || 'Exhibition'
        };

        let emailSent = false;
        let whatsappSent = false;
        const errors = [];

        // Send Email
        if (type === 'email' || type === 'both') {
            try {
                await emailService.sendPaymentDelayWarning(registration, templateData, customMessage);
                emailSent = true;
            } catch (emailError) {
                console.error('Email Send Error:', emailError);
                errors.push(`Email failed: ${emailError.message}`);
            }
        }

        // Send WhatsApp
        if (type === 'whatsapp' || type === 'both') {
            try {
                if (registration.contact1?.mobile) {
                    await whatsappService.sendPaymentDelayWarning(registration.contact1.mobile, templateData, customMessage);
                    whatsappSent = true;
                } else {
                    errors.push('WhatsApp failed: No mobile number');
                }
            } catch (whatsappError) {
                console.error('WhatsApp Send Error:', whatsappError);
                errors.push(`WhatsApp failed: ${whatsappError.message}`);
            }
        }

        // Update warning history
        registration.warningHistory = registration.warningHistory || [];
        registration.warningHistory.push({
            sentAt: new Date(),
            type,
            message: customMessage || `Payment reminder - ${daysOverdue} days overdue`,
            daysOverdue,
            sentBy: adminName
        });
        registration.warningCount = (registration.warningCount || 0) + 1;
        registration.lastWarningSentAt = new Date();

        await registration.save();

        // Log activity
        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Sent ${type} warning to ${registration.exhibitorName} (${registration.registrationId}) - ${daysOverdue} days overdue`
        );

        res.status(200).json({
            success: true,
            message: 'Warning sent successfully',
            data: {
                emailSent,
                whatsappSent,
                warningCount: registration.warningCount,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    } catch (error) {
        console.error('Send Warning Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send warning'
        });
    }
};
const updateDueDate = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { dueDate } = req.body;

        if (!dueDate) {
            return res.status(400).json({
                success: false,
                message: 'Due date is required'
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
        const previousDate = registration.paymentDueDate;

        registration.paymentDueDate = new Date(dueDate);
        await registration.save();

        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Updated payment due date for ${registration.exhibitorName} from ${previousDate ? new Date(previousDate).toLocaleDateString() : 'N/A'} to ${new Date(dueDate).toLocaleDateString()}`
        );

        res.status(200).json({
            success: true,
            message: 'Due date updated successfully',
            data: {
                paymentDueDate: registration.paymentDueDate
            }
        });
    } catch (error) {
        console.error('Update Due Date Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update due date'
        });
    }
};
const getWarningHistory = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await ExhibitorRegistration.findById(registrationId)
            .select('exhibitorName registrationId warningHistory warningCount lastWarningSentAt paymentDueDate');

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
                paymentDueDate: registration.paymentDueDate,
                warningCount: registration.warningCount || 0,
                lastWarningSentAt: registration.lastWarningSentAt,
                history: registration.warningHistory || []
            }
        });
    } catch (error) {
        console.error('Get Warning History Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get warning history'
        });
    }
};
const sendBulkWarnings = async (req, res) => {
    try {
        const { type = 'both', minDaysOverdue = 0 } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const query = {
            status: { $in: ['pending', 'advance-paid'] },
            balanceAmount: { $gt: 0 },
            paymentDueDate: { $lt: today }
        };

        const registrations = await ExhibitorRegistration.find(query)
            .populate('eventId', 'name')
            .limit(50); // Limit to 50 at a time

        const results = {
            total: registrations.length,
            emailSent: 0,
            whatsappSent: 0,
            failed: 0,
            errors: []
        };

        for (const registration of registrations) {
            const dueDate = registration.paymentDueDate ? new Date(registration.paymentDueDate) : null;
            const daysOverdue = dueDate ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;

            if (daysOverdue < minDaysOverdue) continue;

            const templateData = {
                exhibitorName: registration.exhibitorName,
                contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                eventName: registration.eventId?.name || 'Exhibition',
                registrationId: registration.registrationId,
                stallNo: registration.participation?.stallNo || 'N/A',
                balanceAmount: registration.balanceAmount || 0,
                penaltyAmount: registration.penaltyAmount || 0,
                totalPayable: registration.totalPayable || registration.balanceAmount || 0,
                daysOverdue,
                paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor/payment/${registration._id}`
            };

            let emailSent = false;
            let whatsappSent = false;

            // Send Email
            if (type === 'email' || type === 'both') {
                try {
                    await emailService.sendPaymentDelayWarning(registration, templateData);
                    emailSent = true;
                    results.emailSent++;
                } catch (err) {
                    results.errors.push(`${registration.registrationId}: Email failed`);
                }
            }

            // Send WhatsApp
            if (type === 'whatsapp' || type === 'both') {
                try {
                    if (registration.contact1?.mobile) {
                        await whatsappService.sendPaymentDelayWarning(registration.contact1.mobile, templateData);
                        whatsappSent = true;
                        results.whatsappSent++;
                    }
                } catch (err) {
                    results.errors.push(`${registration.registrationId}: WhatsApp failed`);
                }
            }

            // Update warning history
            if (emailSent || whatsappSent) {
                registration.warningHistory = registration.warningHistory || [];
                registration.warningHistory.push({
                    sentAt: new Date(),
                    type,
                    message: `Bulk warning - ${daysOverdue} days overdue`,
                    daysOverdue,
                    sentBy: 'system'
                });
                registration.warningCount = (registration.warningCount || 0) + 1;
                registration.lastWarningSentAt = new Date();
                await registration.save();
            } else {
                results.failed++;
            }
        }

        await logActivity(req, 'Updated', 'Exhibitor Bookings',
            `Sent bulk ${type} warnings to ${results.emailSent + results.whatsappSent} overdue registrations`
        );

        res.status(200).json({
            success: true,
            message: 'Bulk warnings sent',
            data: results
        });
    } catch (error) {
        console.error('Bulk Warning Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send bulk warnings'
        });
    }
};

module.exports = {
    getOverduePayments,
    sendWarning,
    updateDueDate,
    getWarningHistory,
    sendBulkWarnings
};
