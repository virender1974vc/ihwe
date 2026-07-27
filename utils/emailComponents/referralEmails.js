'use strict';

const { getReferralAdminAlertTemplate } = require('../emailTemplates/referralAdminAlert');

async function sendReferralAdminNotification(referral) {
    try {
        const recipientEmail = process.env.EXHIBITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[ReferralAdminAlert] No EXHIBITOR_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const subject = `NEW REFERRAL SUBMISSION | IHWE 2026 | ${referral.companyName || 'New Company'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getReferralAdminAlertTemplate(referral),
            profile: 'EXHIBITOR',
            logData: {
                name: referral.contactPerson,
                phone: referral.mobileNumber,
                message: 'Referral Admin Alert'
            }
        });

        console.log(`[ReferralAdminAlert] Sent to ${recipientEmail} for ${referral.companyName}`);
        return true;
    } catch (error) {
        console.error('[ReferralAdminAlert] Error:', error);
        return false;
    }
}

module.exports = { sendReferralAdminNotification };
