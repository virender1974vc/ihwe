'use strict';

const { detailRow, escapeHtml, getRegistrationTimestamp } = require('./visitorAdminTemplateUtils');

const money = (value, currency = 'INR') => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'N/A';
    return `${currency === 'USD' ? 'USD' : 'INR'} ${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const getContactName = (registration = {}) => {
    const contact = registration.contact1 || {};
    return [contact.title, contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A';
};

const getBaseRows = (registration = {}) => {
    const contact = registration.contact1 || {};
    const participation = registration.participation || {};
    return [
        ['Registration ID', registration.registrationId],
        ['Exhibitor Name', registration.exhibitorName],
        ['Contact Person', getContactName(registration)],
        ['Email ID', contact.email],
        ['Mobile Number', contact.mobile || contact.whatsapp],
        ['Stall Number', participation.stallFor],
        ['Stall Type', participation.stallType],
        ['Stall Size', participation.stallSize ? `${participation.stallSize} sq. m.` : null]
    ];
};

const renderAlert = ({ title, intro, sectionTitle, rows, actions, note, tone = 'blue', timestamp }) => {
    const palette = tone === 'red'
        ? { bar: '#b42318', light: '#fff1f0', border: '#f3b7b1', text: '#912018' }
        : tone === 'green'
            ? { bar: '#08783f', light: '#effaf3', border: '#b8ddc6', text: '#086c3a' }
            : tone === 'amber'
                ? { bar: '#a15c00', light: '#fff8e8', border: '#eed7a0', text: '#805000' }
                : { bar: '#0646a8', light: '#eef5ff', border: '#bfd3ef', text: '#073f91' };
    const stamp = timestamp || getRegistrationTimestamp({});

    return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#101828;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background-color:#f3f5f8;">
<tr><td align="center" style="padding:18px 8px;">
<table role="presentation" width="800" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:800px;border-collapse:collapse;background-color:#ffffff;border:1px solid #d8dee8;">
<tr><td style="padding:24px 28px;border-bottom:1px solid #d8dee8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="top" style="font-size:22px;line-height:28px;font-weight:800;color:#0b1934;text-transform:uppercase;">${escapeHtml(title)}</td>
<td width="190" align="right" valign="top" style="width:190px;font-size:12px;line-height:18px;color:#344054;">This is an automated email.<br><span style="color:#b42318;">Please do not reply.</span></td>
</tr></table>
<div style="margin-top:6px;font-size:15px;line-height:21px;font-weight:700;color:#596579;">9th International Health &amp; Wellness Expo 2026 (IHWE &ndash; Global Edition)</div>
</td></tr>
<tr><td style="padding:24px 28px 10px;">
<p style="margin:0 0 12px;font-size:16px;line-height:23px;font-weight:700;">Dear Team,</p>
<p style="margin:0;font-size:15px;line-height:23px;">${escapeHtml(intro)}</p>
</td></tr>
<tr><td style="padding:16px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #d8dee8;">
<tr><td colspan="2" style="padding:13px 18px;background-color:${palette.bar};font-size:17px;line-height:22px;font-weight:800;color:#ffffff;text-transform:uppercase;">${escapeHtml(sectionTitle)}</td></tr>
${rows.map(([label, value, options]) => detailRow(label, value, options)).join('')}
</table></td></tr>
<tr><td style="padding:22px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background-color:${palette.light};border:1px solid ${palette.border};">
<tr><td style="padding:14px 18px;font-size:16px;line-height:22px;font-weight:800;color:${palette.text};">ACTION REQUIRED</td></tr>
${actions.map(action => `<tr><td style="padding:0 18px 10px;font-size:14px;line-height:21px;color:#101828;"><span style="color:${palette.text};font-weight:800;">&#10003;&nbsp;</span>${escapeHtml(action)}</td></tr>`).join('')}
</table></td></tr>
<tr><td style="padding:20px 28px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background-color:#fff9e8;border:1px solid #efd89f;"><tr><td style="padding:14px 18px;font-size:14px;line-height:21px;color:#5e4700;"><strong>IMPORTANT NOTE:</strong> ${escapeHtml(note)}</td></tr></table>
<p style="margin:20px 0 0;font-size:14px;line-height:21px;">Best Regards,<br><strong>Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</p>
</td></tr>
<tr><td align="center" style="padding:15px 20px;border-top:1px solid #d8dee8;font-size:12px;line-height:18px;color:#667085;">Alert generated on ${escapeHtml(stamp.date)} at ${escapeHtml(stamp.time)}<br>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</td></tr>
</table></td></tr></table></body></html>`;
};

const registrationRows = (registration, extra = []) => [...getBaseRows(registration), ...extra];

const getAccessoryOrderAdminAlertTemplate = (registration, order) => renderAlert({
    title: 'New Exhibitor Accessory Order Alert',
    intro: 'A new exhibitor accessory order has been received. Please verify the order and payment details below.',
    sectionTitle: 'Accessory Order Details',
    rows: registrationRows(registration, [
        ['Order Number', order.orderNo],
        ['Order Items', (order.items || []).map(item => `${item.name} (Qty: ${item.qty})`).join(', ')],
        ['Payment Status', order.paymentStatus],
        ['Transaction ID', order.transactionId],
        ['Grand Total', order.paymentStatus === 'complimentary' ? 'Complimentary' : money(order.grandTotal, registration.participation?.currency)]
    ]),
    actions: ['Verify the accessory order and payment', 'Coordinate item allocation with the operations team', 'Update the order status in IHWE CRM'],
    note: 'Confirm inventory availability before committing delivery to the exhibitor.',
    tone: 'blue',
    timestamp: getRegistrationTimestamp(order)
});

const getPaymentReceiptAdminAlertTemplate = (registration) => {
    const lastPayment = (registration.paymentHistory || []).slice(-1)[0] || {};
    return renderAlert({
        title: 'Exhibitor Payment Receipt Admin Alert',
        intro: 'An exhibitor payment receipt has been generated and sent to the exhibitor.',
        sectionTitle: 'Payment Receipt Details',
        rows: registrationRows(registration, [
            ['Payment Status', registration.paymentStatus || (registration.balanceAmount <= 0 ? 'Full Received' : 'Advance Received')],
            ['Amount Paid', money(registration.amountPaid, registration.participation?.currency)],
            ['Balance Amount', money(registration.balanceAmount, registration.participation?.currency)],
            ['Payment Method', lastPayment.method || registration.manualPaymentDetails?.method || registration.paymentMode],
            ['Transaction ID', lastPayment.transactionId || lastPayment.razorpayPaymentId || registration.manualPaymentDetails?.transactionId || registration.paymentId]
        ]),
        actions: ['Verify the transaction in the payment dashboard', 'Reconcile the receipt with the exhibitor ledger', 'Update the payment status in IHWE CRM'],
        note: 'Escalate any amount or transaction mismatch to the accounts team.',
        tone: 'green',
        timestamp: getRegistrationTimestamp(lastPayment.paidAt ? { createdAt: lastPayment.paidAt } : registration)
    });
};

const getApprovalAdminAlertTemplate = registration => renderAlert({
    title: 'Exhibitor Registration Approved Admin Alert',
    intro: 'An exhibitor registration has been approved and the approval email has been sent to the exhibitor.',
    sectionTitle: 'Approved Exhibitor Details',
    rows: registrationRows(registration, [['Registration Status', 'Approved']]),
    actions: ['Verify exhibitor onboarding access', 'Coordinate pending documentation, if any', 'Update the approved exhibitor list'],
    note: 'Ensure the exhibitor can access the portal and the assigned stall information is correct.',
    tone: 'green',
    timestamp: getRegistrationTimestamp(registration)
});

const getBookingConfirmedAdminAlertTemplate = registration => renderAlert({
    title: 'Exhibitor Booking Confirmed Admin Alert',
    intro: 'An exhibitor booking has been confirmed and the confirmation email has been sent to the exhibitor.',
    sectionTitle: 'Confirmed Booking Details',
    rows: registrationRows(registration, [['Booking Status', 'Confirmed']]),
    actions: ['Verify the final stall allocation', 'Coordinate onboarding and operational requirements', 'Update the confirmed booking register'],
    note: 'Any stall allocation change must be reflected in both CRM and floor-plan records.',
    tone: 'green',
    timestamp: getRegistrationTimestamp(registration)
});

const getRejectionAdminAlertTemplate = registration => renderAlert({
    title: 'Exhibitor Rejection Admin Alert',
    intro: 'An exhibitor registration has been rejected and the rejection email has been sent to the applicant.',
    sectionTitle: 'Rejected Registration Details',
    rows: registrationRows(registration, [
        ['Registration Status', 'Rejected'],
        ['Rejection Reason', registration.rejectionReason || registration.remarks || registration.adminRemarks]
    ]),
    actions: ['Verify that the rejection reason is recorded', 'Update the registration status in IHWE CRM', 'Retain supporting review notes for reference'],
    note: 'Do not initiate exhibitor onboarding unless the registration is reviewed and approved again.',
    tone: 'red',
    timestamp: getRegistrationTimestamp(registration)
});

const getPaymentFailedAdminAlertTemplate = registration => {
    const lastPayment = (registration.paymentHistory || []).slice(-1)[0] || {};
    return renderAlert({
        title: 'Exhibitor Payment Failed Admin Alert',
        intro: 'An exhibitor payment attempt has failed. Please review the transaction and coordinate with the exhibitor if required.',
        sectionTitle: 'Failed Payment Details',
        rows: registrationRows(registration, [
            ['Payment Status', 'Failed'],
            ['Attempted Amount', money(lastPayment.amount || registration.amountPaid, registration.participation?.currency)],
            ['Transaction ID', lastPayment.transactionId || lastPayment.razorpayPaymentId || registration.paymentId],
            ['Failure Reason', lastPayment.failureReason || registration.paymentFailureReason || registration.remarks]
        ]),
        actions: ['Verify the failed transaction in the payment dashboard', 'Contact the exhibitor and share retry guidance', 'Keep the booking payment status pending until successful payment'],
        note: 'Do not mark the booking as paid or confirmed until payment verification succeeds.',
        tone: 'red',
        timestamp: getRegistrationTimestamp(lastPayment.createdAt ? { createdAt: lastPayment.createdAt } : registration)
    });
};

module.exports = {
    getAccessoryOrderAdminAlertTemplate,
    getApprovalAdminAlertTemplate,
    getBookingConfirmedAdminAlertTemplate,
    getPaymentFailedAdminAlertTemplate,
    getPaymentReceiptAdminAlertTemplate,
    getRejectionAdminAlertTemplate,
    money,
    renderAlert
};
