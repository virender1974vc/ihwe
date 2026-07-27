'use strict';

const { getSpeakerNominationAdminAlertTemplate } = require('../emailTemplates/speakerNominationAdminAlert');

async function sendSpeakerAdminNotification(data) {
    try {
        const recipientEmail = process.env.SPEAKER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[SpeakerAdminAlert] No SPEAKER_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const subject = `NEW SPEAKER NOMINATION | IHWE 2026 | ${data.fullName || data.name || 'New Speaker'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getSpeakerNominationAdminAlertTemplate(data),
            profile: 'SPEAKER',
            logData: {
                name: data.fullName || data.name,
                phone: data.phone || data.mobile,
                message: 'Speaker Nomination Admin Alert'
            }
        });

        console.log(`[SpeakerAdminAlert] Sent to ${recipientEmail} for ${data.fullName || data.name}`);
        return true;
    } catch (error) {
        console.error('[SpeakerAdminAlert] Error:', error);
        return false;
    }
}

async function sendSpeakerNominationEmails(nomination) {
    const userResult = await this.sendDynamicConfirmation({
        to: nomination.email,
        formType: 'speaker-nomination',
        data: {
            ...nomination,
            fullName: nomination.fullName,
            full_name: nomination.fullName,
            company: nomination.organization,
            mobile: nomination.phone
        },
        profile: 'SPEAKER',
        notifyAdmin: false
    });

    await this.sendSpeakerAdminNotification(nomination);
    return userResult;
}

module.exports = { sendSpeakerAdminNotification, sendSpeakerNominationEmails };
