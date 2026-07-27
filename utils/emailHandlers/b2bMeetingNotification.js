'use strict';

const { getB2BMeetingAdminAlertTemplate } = require('../emailTemplates/b2bMeetingAdminAlert');

async function sendB2BMeetingNotification(data) {
    try {
        const recipientEmail = process.env.B2B_COORDINATOR_EMAIL || process.env.VISITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[B2BMeetingAdminAlert] No B2B_COORDINATOR_EMAIL, VISITOR_ADMIN_EMAIL or ADMIN_EMAIL configured.');
            return false;
        }

        const subject = `NEW B2B MEETING REQUEST | IHWE 2026 | Reg ID: ${data.registrationId || 'N/A'}`;
        const sent = await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getB2BMeetingAdminAlertTemplate(data),
            profile: 'VISITOR',
            logData: {
                name: [data.firstName, data.lastName].filter(Boolean).join(' '),
                phone: data.mobile,
                message: 'B2B Meeting Request Admin Alert'
            }
        });

        if (sent) {
            console.log(`[B2BMeetingAdminAlert] Sent to ${recipientEmail} for ${data.registrationId || 'N/A'}`);
        }
        return sent;
    } catch (error) {
        console.error('[B2BMeetingAdminAlert] Error:', error);
        return false;
    }
}

module.exports = sendB2BMeetingNotification;
