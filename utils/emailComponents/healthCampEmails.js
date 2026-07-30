'use strict';

const { getHealthCampVisitorAdminAlertTemplate } = require('../emailTemplates/healthCampVisitorAdminAlert');

async function sendHealthCampAdminNotification(data) {
    try {
        const recipientEmail = process.env.VISITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[HealthCampAdminAlert] No VISITOR_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const registrationSource = data.created_by ? 'Portal' : 'Web';
        const subject = `${registrationSource} | NEW HEALTH CAMP REGISTRATION | IHWE 2026 | Reg ID: ${data.registrationId || 'N/A'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getHealthCampVisitorAdminAlertTemplate(data),
            profile: 'VISITOR',
            logData: {
                name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                phone: data.mobile,
                message: 'Health Camp Visitor Admin Alert'
            }
        });

        console.log(`[HealthCampAdminAlert] Sent to ${recipientEmail} for ${data.registrationId}`);
        return true;
    } catch (error) {
        console.error('[HealthCampAdminAlert] Error:', error);
        return false;
    }
}

module.exports = { sendHealthCampAdminNotification };
