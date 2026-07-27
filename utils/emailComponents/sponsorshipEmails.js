'use strict';

const { getSponsorshipEnquiryAdminAlertTemplate } = require('../emailTemplates/sponsorshipEnquiryAdminAlert');

async function sendSponsorshipAdminNotification(data) {
    try {
        const recipientEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[SponsorshipAdminAlert] No CONTACT_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const subject = `NEW SPONSORSHIP ENQUIRY | IHWE 2026 | ${data.company || data.companyName || 'New Company'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getSponsorshipEnquiryAdminAlertTemplate(data),
            profile: 'CONTACT',
            logData: {
                name: data.name || data.fullName,
                phone: data.phone,
                message: 'Sponsorship Enquiry Admin Alert'
            }
        });

        console.log(`[SponsorshipAdminAlert] Sent to ${recipientEmail} for ${data.company || data.companyName}`);
        return true;
    } catch (error) {
        console.error('[SponsorshipAdminAlert] Error:', error);
        return false;
    }
}

module.exports = { sendSponsorshipAdminNotification };
