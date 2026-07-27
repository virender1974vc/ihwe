'use strict';

const { getSellerRegistrationAdminAlertTemplate } = require('../emailTemplates/sellerRegistrationAdminAlert');

async function sendSellerAdminNotification(seller) {
    try {
        const recipientEmail = process.env.EXHIBITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        if (!recipientEmail) {
            console.warn('[SellerAdminAlert] No EXHIBITOR_ADMIN_EMAIL or ADMIN_EMAIL configured');
            return false;
        }

        const subject = `NEW SELLER REGISTRATION | IHWE 2026 | Reg ID: ${seller.registrationId || 'N/A'}`;

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html: getSellerRegistrationAdminAlertTemplate(seller),
            profile: 'EXHIBITOR',
            logData: {
                name: seller.fullName || seller.companyName,
                phone: seller.mobileNumber,
                message: 'Seller Registration Admin Alert'
            }
        });

        console.log(`[SellerAdminAlert] Sent to ${recipientEmail} for ${seller.registrationId}`);
        return true;
    } catch (error) {
        console.error('[SellerAdminAlert] Error:', error);
        return false;
    }
}

module.exports = { sendSellerAdminNotification };
