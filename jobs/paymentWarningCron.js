const cron = require('node-cron');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const emailService = require('../utils/emailService');
const whatsappService = require('../utils/whatsappService');

const LOCAL_TEST_EMAIL = process.env.LOCAL_REMINDER_TEST_EMAIL || 'manishsirohi023@gmail.com';
const LOCAL_TEST_PHONE = process.env.LOCAL_REMINDER_TEST_PHONE || '9568259784';

const isProductionEnv = () => process.env.NODE_ENV === 'production';

const getReminderRecipients = (registration) => {
    if (isProductionEnv()) {
        return {
            emailRegistration: registration,
            whatsappPhone: registration.contact1?.mobile || ''
        };
    }

    const emailRegistration = registration.toObject ? registration.toObject() : { ...registration };
    emailRegistration.contact1 = {
        ...(emailRegistration.contact1 || {}),
        email: LOCAL_TEST_EMAIL,
        mobile: LOCAL_TEST_PHONE
    };

    return {
        emailRegistration,
        whatsappPhone: LOCAL_TEST_PHONE
    };
};

const parseAmount = (value) => {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
};

const normalizeDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const claimReminderForToday = async (registrationId, today) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return ExhibitorRegistration.findOneAndUpdate(
        {
            _id: registrationId,
            $or: [
                { lastWarningSentAt: { $exists: false } },
                { lastWarningSentAt: null },
                { lastWarningSentAt: { $lt: today } },
                { lastWarningSentAt: { $gte: tomorrow } }
            ]
        },
        { $set: { lastWarningSentAt: new Date() } },
        { returnDocument: 'after' }
    );
};

const getNextPaymentDue = (registration) => {
    const unpaidInstallments = (registration.installments || [])
        .filter((inst) => inst && inst.status !== 'paid' && parseAmount(inst.dueAmount) > parseAmount(inst.paidAmount))
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

    const installment = unpaidInstallments[0] || null;
    const dueDate = normalizeDate(installment?.dueDate || registration.paymentDueDate);
    if (!dueDate) return null;

    return {
        dueDate,
        label: installment?.label || registration.paymentPlanLabel || 'Payment',
        amount: installment ? Math.max(0, parseAmount(installment.dueAmount) - parseAmount(installment.paidAmount)) : parseAmount(registration.balanceAmount),
        isInstallment: Boolean(installment),
    };
};

const buildReminderMessage = (dueInfo, templateData) => {
    const amount = Number(dueInfo.amount || templateData.balanceAmount || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2
    });
    const stageText = dueInfo.isInstallment ? ` for ${dueInfo.label}` : '';
    const timingText = templateData.daysOverdue > 0
        ? `is overdue by ${templateData.daysOverdue} day${templateData.daysOverdue === 1 ? '' : 's'}`
        : templateData.daysUntilDue === 0
            ? 'is due today'
            : `is due in ${templateData.daysUntilDue} day${templateData.daysUntilDue === 1 ? '' : 's'}`;

    return `Payment reminder${stageText}: your pending amount of INR ${amount} for ${templateData.eventName || 'the exhibition'} ${timingText}. Please complete the payment to keep your booking, stall allocation and onboarding on track.`;
};

const sendAutomatedWarnings = async () => {
    console.log('[CRON] Starting payment warning check...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const registrations = await ExhibitorRegistration.find({
            status: { $in: ['pending', 'advance-paid'] },
            balanceAmount: { $gt: 0 },
            $or: [
                { paymentDueDate: { $lte: threeDaysFromNow } },
                { installments: { $elemMatch: { status: { $ne: 'paid' }, dueDate: { $lte: threeDaysFromNow } } } }
            ]
        }).populate('eventId', 'name').limit(100);

        console.log(`[CRON] Found ${registrations.length} payments requiring attention`);

        let emailsSent = 0;
        let whatsappSent = 0;
        let errors = 0;
        let skippedOutsideReminderWindow = 0;
        let skippedAlreadyClaimed = 0;

        for (const registration of registrations) {
            const dueInfo = getNextPaymentDue(registration);
            if (!dueInfo) continue;

            const dueDate = dueInfo.dueDate;
            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            const daysOverdue = daysDiff < 0 ? Math.abs(daysDiff) : 0;
            const daysUntilDue = daysDiff >= 0 ? daysDiff : 0;

            const upcomingReminderDays = [1, 3];
            const shouldSendReminder = daysDiff <= 0 || upcomingReminderDays.includes(daysDiff);
            if (!shouldSendReminder) {
                skippedOutsideReminderWindow++;
                continue;
            }

            const claimedRegistration = await claimReminderForToday(registration._id, today);
            if (!claimedRegistration) {
                skippedAlreadyClaimed++;
                console.log(`Skipping ${registration.registrationId} - reminder already claimed/sent today`);
                continue;
            }

            const templateData = {
                exhibitorName: registration.exhibitorName,
                contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                eventName: registration.eventId?.name || 'Exhibition',
                registrationId: registration.registrationId,
                stallNo: registration.participation?.stallFor || registration.participation?.stallNo || 'N/A',
                stallType: registration.participation?.stallType || 'N/A',
                originalAmount: registration.financeBreakdown?.netPayable || registration.participation?.total || 0,
                amountPaid: registration.amountPaid || 0,
                balanceAmount: registration.balanceAmount || 0,
                penaltyAmount: registration.penaltyAmount || 0,
                totalPayable: registration.totalPayable || registration.balanceAmount || 0,
                dueDate: dueDate.toLocaleDateString('en-IN'),
                installmentLabel: dueInfo.label,
                installmentAmount: dueInfo.amount,
                daysOverdue,
                daysUntilDue,
                isUpcoming: daysUntilDue > 0,
                paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor-dashboard/payments`,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@exhibition.com',
                supportPhone: process.env.SUPPORT_PHONE || '',
                companyName: process.env.COMPANY_NAME || 'Exhibition',
                reminderTitle: dueInfo.isInstallment ? 'INSTALLMENT PAYMENT REMINDER' : 'PAYMENT REMINDER',
                reminderLine: daysOverdue > 0
                    ? `${dueInfo.label} is overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}.`
                    : daysUntilDue === 0
                        ? `${dueInfo.label} is due today.`
                        : `${dueInfo.label} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}.`
            };
            const customMessage = buildReminderMessage(dueInfo, templateData);
            const recipients = getReminderRecipients(registration);

            let emailSuccess = false;
            let whatsappSuccess = false;

            try {
                await emailService.sendPaymentDelayWarning(recipients.emailRegistration, templateData, customMessage);
                emailSuccess = true;
                emailsSent++;
            } catch (emailError) {
                console.error(`Email failed for ${registration.registrationId}:`, emailError.message);
                errors++;
            }

            try {
                if (recipients.whatsappPhone) {
                    const result = await whatsappService.sendPaymentDelayWarning(recipients.whatsappPhone, templateData, customMessage);
                    if (result?.success) {
                        whatsappSuccess = true;
                        whatsappSent++;
                    }
                }
            } catch (whatsappError) {
                console.error(`WhatsApp failed for ${registration.registrationId}:`, whatsappError.message);
            }

            if (emailSuccess || whatsappSuccess) {
                claimedRegistration.warningHistory = claimedRegistration.warningHistory || [];
                claimedRegistration.warningHistory.push({
                    sentAt: new Date(),
                    type: emailSuccess && whatsappSuccess ? 'both' : emailSuccess ? 'email' : 'whatsapp',
                    message: daysUntilDue > 0
                        ? `Upcoming ${dueInfo.isInstallment ? 'installment' : 'payment'} reminder (${dueInfo.label}) - due in ${daysUntilDue} days`
                        : `Automated ${dueInfo.isInstallment ? 'installment' : 'payment'} warning (${dueInfo.label}) - ${daysOverdue} days overdue`,
                    daysOverdue,
                    sentBy: 'system'
                });
                claimedRegistration.paymentDueDate = dueDate;
                claimedRegistration.warningCount = (claimedRegistration.warningCount || 0) + 1;
                await claimedRegistration.save();

                console.log(`${daysUntilDue > 0 ? `Upcoming (${daysUntilDue}d)` : `Overdue (${daysOverdue}d)`} reminder sent to ${registration.registrationId}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[CRON] Payment warnings complete: ${emailsSent} emails, ${whatsappSent} WhatsApp, ${errors} errors, ${skippedAlreadyClaimed} already sent today, ${skippedOutsideReminderWindow} outside reminder window`);
    } catch (error) {
        console.error('[CRON] Payment warning error:', error);
    }
};

const initPaymentWarningCron = () => {
    const schedule = process.env.PAYMENT_WARNING_CRON || '23 14 * * *';
    cron.schedule(schedule, sendAutomatedWarnings, {
        timezone: 'Asia/Kolkata'
    });
    console.log(`Payment warning cron job scheduled (${schedule}, Asia/Kolkata)`);
    if (!isProductionEnv()) {
        console.log(`[CRON] Local reminder guard active: emails -> ${LOCAL_TEST_EMAIL}, WhatsApp -> ${LOCAL_TEST_PHONE}`);
    }

    if (process.env.RUN_PAYMENT_REMINDERS_ON_START === 'true') {
        setTimeout(sendAutomatedWarnings, 5000);
    }
};

module.exports = {
    initPaymentWarningCron,
    sendAutomatedWarnings
};
