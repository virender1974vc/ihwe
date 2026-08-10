'use strict';

// Fires when an Accounts payment is recorded with pymnt_type "Advance Payment"
// (see controllers/paymentController.js -> addPayment). Uses the dynamic,
// already-built emailTemplateGenerator (the IHWE booking-confirmation layout with
// an installment schedule) rather than a bespoke template.
async function sendAdvancePaymentConfirmation({ to, payment, docData, contact, event }) {
    if (!to) return false;
    try {
        const emailTemplateGenerator = require('../emailTemplateGenerator');

        const paidAmount = Number(payment.amount_text || payment.f_amount || 0);
        const totalAmount = Number(docData?.finalAmount || 0);
        const proformaInvoiceNo = docData?.est_no || docData?.pi_no || docData?.invoice_no || '—';
        const eventName = docData?.event_name || event?.name || '9th International Health & Wellness Expo 2026 – Global Edition';

        const data = {
            clientName: contact?.name,
            companyName: contact?.companyName,
            eventName,
            proformaInvoiceNo,
            totalAmount,
            netPayable: totalAmount,
            amountPaid: paidAmount,
            paymentStatus: 'PARTIAL',
            paymentDate: payment.payment_date || payment.added,
            paymentPlanLabel: docData?.paymentPlanLabel || 'Advance Payment',
            pendingInstallmentLabel: 'Balance Payment',
            dashboardUrl: `${(process.env.SITE_URL || 'https://ihwe.in').replace(/\/$/, '')}/exhibitor-login`,
            dashboardUsername: contact?.email
        };

        const { subject, html, attachments } = emailTemplateGenerator.generateIHWEConfirmation({
            subject: `PAYMENT RECEIVED — ${proformaInvoiceNo} | ${data.companyName || 'IHWE 2026'}`,
            data,
            template: {}
        });

        return await this.sendEmail({
            to,
            subject,
            html,
            attachments,
            profile: 'EXHIBITOR',
            logData: {
                name: contact?.name,
                phone: contact?.mobile,
                message: `Advance Payment Confirmation (${proformaInvoiceNo})`
            }
        });
    } catch (err) {
        console.error('sendAdvancePaymentConfirmation error:', err.message);
        return false;
    }
}

module.exports = sendAdvancePaymentConfirmation;
