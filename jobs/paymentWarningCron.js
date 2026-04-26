const cron = require('node-cron');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const emailService = require('../utils/emailService');
const whatsappService = require('../utils/whatsappService');

/**
 * Payment Warning Cron Job
 * Runs daily at 9:00 AM to send payment delay warnings
 */

const sendAutomatedWarnings = async () => {
    console.log('🔔 [CRON] Starting payment warning check...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find payments that are due soon OR overdue
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const registrations = await ExhibitorRegistration.find({
            status: { $in: ['pending', 'advance-paid'] },
            balanceAmount: { $gt: 0 },
            paymentDueDate: { $lte: threeDaysFromNow } // Due within 3 days OR overdue
        }).populate('eventId', 'name').limit(100);

        console.log(`📊 Found ${registrations.length} payments requiring attention`);

        let emailsSent = 0;
        let whatsappSent = 0;
        let errors = 0;

        for (const registration of registrations) {
            const dueDate = registration.paymentDueDate ? new Date(registration.paymentDueDate) : null;
            if (!dueDate) continue;

            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            const daysOverdue = daysDiff < 0 ? Math.abs(daysDiff) : 0;
            const daysUntilDue = daysDiff >= 0 ? daysDiff : 0;

            // Skip if warning already sent today
            if (registration.lastWarningSentAt) {
                const lastSent = new Date(registration.lastWarningSentAt);
                lastSent.setHours(0, 0, 0, 0);
                if (lastSent.getTime() === today.getTime()) {
                    console.log(`⏭️  Skipping ${registration.registrationId} - warning already sent today`);
                    continue;
                }
            }

            // Determine if we should send warning
            // Before due: 3 days, 1 day
            // On due: 0 days
            // After due: 1, 3, 7, 14, 21, 30 days
            const warningDays = [-3, -1, 0, 1, 3, 7, 14, 21, 30];
            if (!warningDays.includes(daysDiff)) {
                continue; // Skip if not a warning day
            }

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
                daysUntilDue,
                isUpcoming: daysUntilDue > 0,
                paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor-dashboard/payments`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@exhibition.com',
                supportPhone: process.env.SUPPORT_PHONE || '+91 9876543210',
                companyName: process.env.COMPANY_NAME || 'Exhibition'
            };

            let emailSuccess = false;
            let whatsappSuccess = false;

            // Send Email
            try {
                await emailService.sendPaymentDelayWarning(registration, templateData);
                emailSuccess = true;
                emailsSent++;
            } catch (emailError) {
                console.error(`❌ Email failed for ${registration.registrationId}:`, emailError.message);
                errors++;
            }

            // Send WhatsApp
            try {
                if (registration.contact1?.mobile) {
                    const result = await whatsappService.sendPaymentDelayWarning(registration.contact1.mobile, templateData);
                    if (result.success) {
                        whatsappSuccess = true;
                        whatsappSent++;
                    }
                }
            } catch (whatsappError) {
                console.error(`❌ WhatsApp failed for ${registration.registrationId}:`, whatsappError.message);
            }

            // Update warning history
            if (emailSuccess || whatsappSuccess) {
                registration.warningHistory = registration.warningHistory || [];
                registration.warningHistory.push({
                    sentAt: new Date(),
                    type: emailSuccess && whatsappSuccess ? 'both' : emailSuccess ? 'email' : 'whatsapp',
                    message: daysUntilDue > 0
                        ? `Upcoming payment reminder - due in ${daysUntilDue} days`
                        : `Automated warning - ${daysOverdue} days overdue`,
                    daysOverdue,
                    sentBy: 'system'
                });
                registration.warningCount = (registration.warningCount || 0) + 1;
                registration.lastWarningSentAt = new Date();
                await registration.save();

                console.log(`✅ ${daysUntilDue > 0 ? `Upcoming (${daysUntilDue}d)` : `Overdue (${daysOverdue}d)`} reminder sent to ${registration.registrationId}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`✅ [CRON] Payment warnings complete: ${emailsSent} emails, ${whatsappSent} WhatsApp, ${errors} errors`);
    } catch (error) {
        console.error('❌ [CRON] Payment warning error:', error);
    }
};

/**
 * Initialize cron job
 * Runs every day at 9:00 AM
 */
const initPaymentWarningCron = () => {
    // Schedule: Every day at 9:00 AM
    cron.schedule('0 9 * * *', sendAutomatedWarnings, {
        timezone: 'Asia/Kolkata'
    });

    console.log('⏰ Payment warning cron job scheduled (Daily at 9:00 AM IST)');

    // Optional: Run immediately on startup for testing (comment out in production)
    // setTimeout(sendAutomatedWarnings, 5000);
};

module.exports = {
    initPaymentWarningCron,
    sendAutomatedWarnings
};
