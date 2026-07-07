const cron = require('node-cron');
const Event = require('../models/Event');
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

const getNextUnpaidInstallment = (registration) => {
    return (registration.installments || [])
        .filter((inst) => inst && inst.status !== 'paid' && parseAmount(inst.dueAmount) > parseAmount(inst.paidAmount))
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))[0] || null;
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

const buildExhibitionReminderMessage = (event, registration, reminderType, daysUntilExhibition, installment) => {
    const amount = Number(
        installment
            ? Math.max(0, parseAmount(installment.dueAmount) - parseAmount(installment.paidAmount))
            : registration.balanceAmount || 0
    ).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const stage = installment?.label || registration.paymentPlanLabel || 'Payment';
    const typeText = reminderType === 'installment' ? `installment (${stage})` : 'pending payment';

    return `Exhibition payment reminder: ${event.name} starts in ${daysUntilExhibition} day${daysUntilExhibition === 1 ? '' : 's'}. Your ${typeText} amount of INR ${amount} is still pending. Please clear it to keep your booking, stall allocation and onboarding on track.`;
};

const sendExhibitionReminders = async () => {
    console.log('[CRON] Starting exhibition-based payment reminder check...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const events = await Event.find({
            status: 'active',
            startDate: { $gt: today }
        });

        console.log(`[CRON] Found ${events.length} upcoming active events`);

        let emailsSent = 0;
        let whatsappSent = 0;
        let errors = 0;

        for (const event of events) {
            if (!event.startDate) continue;

            const startDate = new Date(event.startDate);
            startDate.setHours(0, 0, 0, 0);

            const daysUntilExhibition = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
            const generalDays = event.generalReminderDays ?? 10;
            const installmentDays = event.installmentReminderDays ?? 15;
            const isGeneralReminderDay = daysUntilExhibition <= generalDays && daysUntilExhibition >= 0;
            const isInstallmentReminderDay = daysUntilExhibition <= installmentDays && daysUntilExhibition >= 0;

            if (!isGeneralReminderDay && !isInstallmentReminderDay) continue;

            console.log(`Event: ${event.name} | Days until exhibition: ${daysUntilExhibition}`);

            const registrations = await ExhibitorRegistration.find({
                eventId: event._id,
                status: { $in: ['pending', 'advance-paid'] },
                balanceAmount: { $gt: 0 }
            }).populate('eventId', 'name');

            for (const registration of registrations) {
                const isOnInstallmentPlan = registration.paymentPlanType && registration.paymentPlanType !== 'full';
                const nextInstallment = getNextUnpaidInstallment(registration);
                const hasPendingInstallments = Boolean(nextInstallment);

                let shouldSend = false;
                let reminderTypeStr = '';
                let customMsg = '';

                if (isGeneralReminderDay && !isOnInstallmentPlan) {
                    shouldSend = true;
                    reminderTypeStr = 'general';
                    customMsg = buildExhibitionReminderMessage(event, registration, reminderTypeStr, daysUntilExhibition, null);
                } else if (isInstallmentReminderDay && (isOnInstallmentPlan || hasPendingInstallments)) {
                    shouldSend = true;
                    reminderTypeStr = 'installment';
                    customMsg = buildExhibitionReminderMessage(event, registration, reminderTypeStr, daysUntilExhibition, nextInstallment);
                }

                if (!shouldSend) continue;

                const claimedRegistration = await claimReminderForToday(registration._id, today);
                if (!claimedRegistration) {
                    console.log(`Skipping ${registration.registrationId} - reminder already claimed/sent today`);
                    continue;
                }

                const dueDate = nextInstallment?.dueDate || registration.paymentDueDate;
                const templateData = {
                    exhibitorName: registration.exhibitorName,
                    contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                    eventName: registration.eventId?.name || event.name,
                    registrationId: registration.registrationId,
                    stallNo: registration.participation?.stallFor || registration.participation?.stallNo || 'N/A',
                    stallType: registration.participation?.stallType || 'N/A',
                    originalAmount: registration.financeBreakdown?.netPayable || registration.participation?.total || 0,
                    amountPaid: registration.amountPaid || 0,
                    balanceAmount: registration.balanceAmount || 0,
                    penaltyAmount: registration.penaltyAmount || 0,
                    totalPayable: registration.totalPayable || registration.balanceAmount || 0,
                    dueDate: dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'N/A',
                    installmentLabel: nextInstallment?.label || registration.paymentPlanLabel || '',
                    installmentAmount: nextInstallment ? Math.max(0, parseAmount(nextInstallment.dueAmount) - parseAmount(nextInstallment.paidAmount)) : 0,
                    daysOverdue: 0,
                    daysUntilDue: daysUntilExhibition,
                    isUpcoming: true,
                    reminderTitle: reminderTypeStr === 'installment' ? 'EXHIBITION INSTALLMENT REMINDER' : 'EXHIBITION PAYMENT REMINDER',
                    reminderLine: `${event.name} starts in ${daysUntilExhibition} day${daysUntilExhibition === 1 ? '' : 's'}.`,
                    paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor-dashboard/payments`,
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@exhibition.com',
                    supportPhone: process.env.SUPPORT_PHONE || '',
                    companyName: process.env.COMPANY_NAME || 'Exhibition'
                };
                const recipients = getReminderRecipients(registration);

                let emailSuccess = false;
                let whatsappSuccess = false;

                try {
                    await emailService.sendPaymentDelayWarning(recipients.emailRegistration, templateData, customMsg);
                    emailSuccess = true;
                    emailsSent++;
                } catch (emailError) {
                    console.error(`Email failed for ${registration.registrationId}:`, emailError.message);
                    errors++;
                }

                try {
                    if (recipients.whatsappPhone) {
                        const result = await whatsappService.sendPaymentDelayWarning(recipients.whatsappPhone, templateData, customMsg);
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
                        message: `Exhibition-based ${reminderTypeStr} reminder (${daysUntilExhibition} days before event)`,
                        daysOverdue: 0,
                        sentBy: 'system-exhibition-cron'
                    });
                    claimedRegistration.warningCount = (claimedRegistration.warningCount || 0) + 1;
                    await claimedRegistration.save();

                    console.log(`Sent ${reminderTypeStr} reminder to ${registration.registrationId}`);
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`[CRON] Exhibition reminders complete: ${emailsSent} emails, ${whatsappSent} WhatsApp, ${errors} errors`);
    } catch (error) {
        console.error('[CRON] Exhibition reminder error:', error);
    }
};

const initExhibitionReminderCron = () => {
    const schedule = process.env.EXHIBITION_REMINDER_CRON || '23 14 * * *';
    cron.schedule(schedule, sendExhibitionReminders, {
        timezone: 'Asia/Kolkata'
    });
    console.log(`Exhibition reminder cron job scheduled (${schedule}, Asia/Kolkata)`);
    if (!isProductionEnv()) {
        console.log(`[CRON] Local reminder guard active: emails -> ${LOCAL_TEST_EMAIL}, WhatsApp -> ${LOCAL_TEST_PHONE}`);
    }

    if (process.env.RUN_EXHIBITION_REMINDERS_ON_START === 'true') {
        setTimeout(sendExhibitionReminders, 8000);
    }
};

module.exports = {
    initExhibitionReminderCron,
    sendExhibitionReminders
};
