'use strict';

const { getExpoSupportAdminAlertTemplate } = require('../emailTemplates/expoSupportAdminAlert');

async function sendExpoSupportAdminNotification(data) {
    try {
        const recipientEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[ExpoSupportAdminAlert] No CONTACT_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const subject = `NEW EXPO SUPPORT ENQUIRY | IHWE 2026 | ${data.company || data.companyName || 'New Company'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getExpoSupportAdminAlertTemplate(data),
            profile: 'CONTACT',
            logData: {
                name: data.name || data.fullName,
                phone: data.phone || data.mobile,
                message: 'Expo Support Enquiry Admin Alert'
            }
        });

        console.log(`[ExpoSupportAdminAlert] Sent to ${recipientEmail} for ${data.company || data.companyName}`);
        return true;
    } catch (error) {
        console.error('[ExpoSupportAdminAlert] Error:', error);
        return false;
    }
}

module.exports = { sendExpoSupportAdminNotification };
