const cron = require('node-cron');
const Event = require('../models/Event');
const ExhibitorRegistration = require('../models/ExhibitorRegistration');
const emailService = require('../utils/emailService');
const whatsappService = require('../utils/whatsappService');
const sendExhibitionReminders = async () => {
    console.log('🔔 [CRON] Starting exhibition-based payment reminder check...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const events = await Event.find({
            status: 'active',
            startDate: { $gt: today }
        });

        console.log(`📊 Found ${events.length} upcoming active events`);

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

            if (!isGeneralReminderDay && !isInstallmentReminderDay) {
                continue;
            }

            console.log(`\n🎟️ Event: ${event.name} | Days until exhibition: ${daysUntilExhibition}`);
            if (isGeneralReminderDay) console.log(`👉 Triggering GENERAL reminders (within ${generalDays} days window)`);
            if (isInstallmentReminderDay) console.log(`👉 Triggering INSTALLMENT reminders (within ${installmentDays} days window)`);

            // Fetch registrations for this event with balance > 0
            const registrations = await ExhibitorRegistration.find({
                eventId: event._id,
                status: { $in: ['pending', 'advance-paid'] },
                balanceAmount: { $gt: 0 }
            }).populate('eventId', 'name');

            for (const registration of registrations) {
                const isOnInstallmentPlan = registration.paymentPlanType && registration.paymentPlanType !== 'full';
                const hasPendingInstallments = registration.installments && registration.installments.some(inst => inst.status !== 'paid');

                let shouldSend = false;
                let reminderTypeStr = '';
                let customMsg = '';

                if (isGeneralReminderDay && !isOnInstallmentPlan) {
                    // Send general reminder to those not on an installment plan
                    shouldSend = true;
                    reminderTypeStr = 'general';
                    customMsg = `Gentle Reminder: The exhibition "${event.name}" is starting in ${daysUntilExhibition} days. Please clear your outstanding balance of ${registration.balanceAmount} to ensure a smooth onboarding process.`;
                } else if (isInstallmentReminderDay && (isOnInstallmentPlan || hasPendingInstallments)) {
                    // Send installment reminder to those on an installment plan
                    shouldSend = true;
                    reminderTypeStr = 'installment';
                    customMsg = `Installment Reminder: The exhibition "${event.name}" is starting in ${daysUntilExhibition} days. Please ensure all your pending installments are cleared before the event.`;
                }

                if (!shouldSend) continue;

                // Build template data
                const templateData = {
                    exhibitorName: registration.exhibitorName,
                    contactPerson: `${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim(),
                    eventName: registration.eventId?.name || event.name,
                    registrationId: registration.registrationId,
                    stallNo: registration.participation?.stallNo || 'N/A',
                    stallType: registration.participation?.stallType || 'N/A',
                    originalAmount: registration.financeBreakdown?.netPayable || registration.participation?.total || 0,
                    amountPaid: registration.amountPaid || 0,
                    balanceAmount: registration.balanceAmount || 0,
                    penaltyAmount: registration.penaltyAmount || 0,
                    totalPayable: registration.totalPayable || registration.balanceAmount || 0,
                    dueDate: registration.paymentDueDate ? new Date(registration.paymentDueDate).toLocaleDateString('en-IN') : 'N/A',
                    daysOverdue: 0,
                    daysUntilDue: daysUntilExhibition,
                    isUpcoming: true,
                    paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor-dashboard/payments`,
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@exhibition.com',
                    supportPhone: process.env.SUPPORT_PHONE || '',
                    companyName: process.env.COMPANY_NAME || 'Exhibition'
                };

                let emailSuccess = false;
                let whatsappSuccess = false;

                // Send Email
                try {
                    await emailService.sendPaymentDelayWarning(registration, templateData, customMsg);
                    emailSuccess = true;
                    emailsSent++;
                } catch (emailError) {
                    console.error(`❌ Email failed for ${registration.registrationId}:`, emailError.message);
                    errors++;
                }

                // Send WhatsApp
                try {
                    if (registration.contact1?.mobile) {
                        // Assuming whatsappService has the same signature or we can at least invoke it
                        const result = await whatsappService.sendPaymentDelayWarning(registration.contact1.mobile, templateData, customMsg);
                        if (result && result.success) {
                            whatsappSuccess = true;
                            whatsappSent++;
                        }
                    }
                } catch (whatsappError) {
                    console.error(`❌ WhatsApp failed for ${registration.registrationId}:`, whatsappError.message);
                }

                // Log the history
                if (emailSuccess || whatsappSuccess) {
                    registration.warningHistory = registration.warningHistory || [];
                    registration.warningHistory.push({
                        sentAt: new Date(),
                        type: emailSuccess && whatsappSuccess ? 'both' : emailSuccess ? 'email' : 'whatsapp',
                        message: `Exhibition-based ${reminderTypeStr} reminder (${daysUntilExhibition} days before event)`,
                        daysOverdue: 0,
                        sentBy: 'system-exhibition-cron'
                    });
                    registration.warningCount = (registration.warningCount || 0) + 1;
                    registration.lastWarningSentAt = new Date();
                    await registration.save();

                    console.log(`✅ Sent ${reminderTypeStr} reminder to ${registration.registrationId}`);
                }

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`✅ [CRON] Exhibition reminders complete: ${emailsSent} emails, ${whatsappSent} WhatsApp, ${errors} errors`);
    } catch (error) {
        console.error('❌ [CRON] Exhibition reminder error:', error);
    }
};

const initExhibitionReminderCron = () => {
    // Schedule: Every day at 10:00 AM
    cron.schedule('0 10 * * *', sendExhibitionReminders, {
        timezone: 'Asia/Kolkata'
    });

    console.log('⏰ Exhibition reminder cron job scheduled (Daily at 10:00 AM IST)');
};

module.exports = {
    initExhibitionReminderCron,
    sendExhibitionReminders
};
