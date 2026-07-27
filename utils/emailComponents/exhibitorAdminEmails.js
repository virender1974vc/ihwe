'use strict';

const {
    getAccessoryOrderAdminAlertTemplate,
    getApprovalAdminAlertTemplate,
    getBookingConfirmedAdminAlertTemplate,
    getPaymentFailedAdminAlertTemplate,
    getPaymentReceiptAdminAlertTemplate,
    getRejectionAdminAlertTemplate
} = require('../emailTemplates/exhibitorLifecycleAdminAlerts');

const sendAdmin = async function ({ registration, subject, html, message }) {
    const to = process.env.EXHIBITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    if (!to) {
        console.warn(`[${message}] Skipped: EXHIBITOR_ADMIN_EMAIL/ADMIN_EMAIL is not configured.`);
        return false;
    }
    return this.sendEmail({
        to,
        subject,
        html,
        profile: 'EXHIBITOR',
        logData: {
            name: registration.exhibitorName,
            phone: registration.contact1?.mobile,
            message
        }
    });
};

async function sendAccessoryOrderAdminAlert(registration, order) {
    return sendAdmin.call(this, {
        registration,
        subject: `NEW EXHIBITOR ACCESSORY ORDER | IHWE 2026 | Order: ${order.orderNo || 'N/A'}`,
        html: getAccessoryOrderAdminAlertTemplate(registration, order),
        message: 'Exhibitor Accessory Order Admin Alert'
    });
}

async function sendPaymentReceiptAdminAlert(registration) {
    return sendAdmin.call(this, {
        registration,
        subject: `EXHIBITOR PAYMENT RECEIPT | IHWE 2026 | Reg ID: ${registration.registrationId || 'N/A'}`,
        html: getPaymentReceiptAdminAlertTemplate(registration),
        message: 'Exhibitor Payment Receipt Admin Alert'
    });
}

async function sendRegistrationApprovedAdminAlert(registration) {
    return sendAdmin.call(this, {
        registration,
        subject: `EXHIBITOR REGISTRATION APPROVED | IHWE 2026 | Reg ID: ${registration.registrationId || 'N/A'}`,
        html: getApprovalAdminAlertTemplate(registration),
        message: 'Exhibitor Registration Approved Admin Alert'
    });
}

async function sendBookingConfirmedAdminAlert(registration) {
    return sendAdmin.call(this, {
        registration,
        subject: `EXHIBITOR BOOKING CONFIRMED | IHWE 2026 | Reg ID: ${registration.registrationId || 'N/A'}`,
        html: getBookingConfirmedAdminAlertTemplate(registration),
        message: 'Exhibitor Booking Confirmed Admin Alert'
    });
}

async function sendRejectionAdminAlert(registration) {
    return sendAdmin.call(this, {
        registration,
        subject: `EXHIBITOR REGISTRATION REJECTED | IHWE 2026 | Reg ID: ${registration.registrationId || 'N/A'}`,
        html: getRejectionAdminAlertTemplate(registration),
        message: 'Exhibitor Rejection Admin Alert'
    });
}

async function sendPaymentFailedAdminAlert(registration) {
    return sendAdmin.call(this, {
        registration,
        subject: `EXHIBITOR PAYMENT FAILED | IHWE 2026 | Reg ID: ${registration.registrationId || 'N/A'}`,
        html: getPaymentFailedAdminAlertTemplate(registration),
        message: 'Exhibitor Payment Failed Admin Alert'
    });
}

module.exports = {
    sendAccessoryOrderAdminAlert,
    sendBookingConfirmedAdminAlert,
    sendPaymentFailedAdminAlert,
    sendPaymentReceiptAdminAlert,
    sendRegistrationApprovedAdminAlert,
    sendRejectionAdminAlert
};
