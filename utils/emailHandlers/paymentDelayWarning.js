'use strict';

async function sendPaymentDelayWarning(registration, templateData, customMessage = null) {
        try {
            const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
            const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

            const daysOverdue = Number(templateData.daysOverdue || 0);
            const daysUntilDue = Number(templateData.daysUntilDue || 0);
            const isOverdue = daysOverdue > 0;
            const isDueToday = !isOverdue && daysUntilDue === 0;
            const reminderTitle = templateData.reminderTitle || (isOverdue ? 'PAYMENT OVERDUE' : isDueToday ? 'PAYMENT DUE TODAY' : 'PAYMENT REMINDER');
            const reminderLine = templateData.reminderLine || (
                isOverdue
                    ? `Your payment is overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}.`
                    : isDueToday
                        ? 'Your payment is due today.'
                        : `Your payment is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}.`
            );
            const accentColor = isOverdue ? '#dc2626' : isDueToday ? '#d97706' : '#2563eb';
            const softBg = isOverdue ? '#fef2f2' : isDueToday ? '#fffbeb' : '#eff6ff';
            const borderColor = isOverdue ? '#fecaca' : isDueToday ? '#fde68a' : '#bfdbfe';
            const subjectStatus = isOverdue
                ? `${daysOverdue} Day${daysOverdue === 1 ? '' : 's'} Overdue`
                : isDueToday
                    ? 'Due Today'
                    : `Due in ${daysUntilDue} Day${daysUntilDue === 1 ? '' : 's'}`;
            const installmentLabel = templateData.installmentLabel || '';
            const installmentAmount = Number(templateData.installmentAmount || 0);

            const html = this.emailShell(`
                <tr>
                    <td style="padding: 0; background-color: #f8fafc;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; border-collapse: collapse;">
                            <tr>
                                <td align="center" style="display: none; padding: 0; height: 0; overflow: hidden; background-color: ${accentColor};">
                                    <span style="font-size: 48px;">⚠️</span>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 8px 28px 28px 28px; background-color: ${accentColor};">
                                    
                                    <h1 style="margin: 0; font-size: 28px; line-height: 34px; font-weight: 800; color: #ffffff;">
                                        ${reminderTitle}
                                    </h1>
                                    <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 23px; color: #ffffff;">
                                        <strong style="color: #ffffff;">${reminderLine}</strong>
                                    </p>
                                </td>
                            </tr>
                            ${customMessage ? `
                            <tr>
                                <td style="padding: 18px 22px; background-color: ${softBg}; border: 1px solid ${borderColor}; border-radius: 8px;">
                                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #0f172a; font-weight: 600;">
                                        "${customMessage}"
                                    </p>
                                </td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 24px 28px 20px 28px; background-color: #ffffff;">
                                    <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #0f172a;">
                                        Dear <strong>${templateData.contactPerson || 'Customer'}</strong>,
                                    </p>
                                    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 22px;">
                                        This is a reminder regarding your pending payment for <strong>${templateData.eventName || 'the Exhibition'}</strong>.
                                        Please complete the payment at the earliest so your exhibition participation and onboarding remain smooth.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 0 28px 20px 28px;">
                                    <h2 style="margin: 0 0 18px 0; font-size: 15px; line-height: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px;">
                                        Payment Details
                                    </h2>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Registration ID:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${templateData.registrationId || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Stall No:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${templateData.stallNo || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Stall Type:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${templateData.stallType || 'N/A'}</td>
                                        </tr>
                                        ${installmentLabel ? `
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Pending Stage:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 700; text-align: right;">${installmentLabel}</td>
                                        </tr>
                                        ` : ''}
                                        ${installmentAmount > 0 ? `
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Stage Amount Due:</td>
                                            <td style="padding: 8px 0; color: ${accentColor}; font-weight: 700; text-align: right;">${fmt(installmentAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr>
                                            <td colspan="2" style="padding: 15px 0; border-top: 1px dashed #e2e8f0;"></td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Original Amount:</td>
                                            <td style="padding: 8px 0; color: #1e293b; text-align: right;">${fmt(templateData.originalAmount || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Amount Paid:</td>
                                            <td style="padding: 8px 0; color: #16a34a; text-align: right;">${fmt(templateData.amountPaid || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Balance Amount:</td>
                                            <td style="padding: 8px 0; color: #dc2626; font-weight: 600; text-align: right;">${fmt(templateData.balanceAmount || 0)}</td>
                                        </tr>
                                        ${templateData.penaltyAmount > 0 ? `
                                        <tr>
                                            <td style="padding: 8px 0; color: #dc2626;">Penalty:</td>
                                            <td style="padding: 8px 0; color: #dc2626; font-weight: 600; text-align: right;">${fmt(templateData.penaltyAmount)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr>
                                            <td colspan="2" style="padding: 15px 0; border-top: 2px solid #1e293b;"></td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; color: #1e293b; font-size: 16px; font-weight: 700;">TOTAL PAYABLE:</td>
                                            <td style="padding: 12px 0; color: ${accentColor}; font-size: 18px; font-weight: 800; text-align: right;">${fmt(templateData.totalPayable || 0)}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 0 28px 20px 28px; background-color: #ffffff;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${softBg}; border-left: 4px solid ${accentColor}; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 14px 16px 6px 16px; color: #64748b; font-size: 13px; line-height: 18px;">
                                                <strong>Payment Due Date:</strong> ${templateData.dueDate || 'N/A'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 0 16px 14px 16px; color: ${accentColor}; font-size: 14px; line-height: 21px; font-weight: 800;">
                                                ${reminderLine}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 28px 28px 28px; background-color: #ffffff; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569; line-height: 20px;">
                                        If you have already made the payment, please ignore this email and share the payment details with us.
                                    </p>
                                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 20px;">
                                        For any queries, please contact us at <a href="mailto:${templateData.supportEmail}" style="color: #23471d; font-weight: 700; text-decoration: none;">${templateData.supportEmail}</a>${templateData.supportPhone ? ` or call <a href="tel:${templateData.supportPhone}" style="color: #23471d; font-weight: 700; text-decoration: none;">${templateData.supportPhone}</a>` : ''}.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `);

            const data = {
                to: registration.contact1?.email,
                subject: `⚠️ Payment Reminder - ${registration.exhibitorName} - ${templateData.daysOverdue || 0} Days Overdue`,
                html
            };

            data.subject = `Payment Reminder - ${registration.exhibitorName} - ${subjectStatus}`;

            const attachments = [];
            if (data.receiptPath && require('fs').existsSync(data.receiptPath)) {
                attachments.push({
                    filename: `Payment_Receipt_${String(data.reference || 'IHWE').replace(/[^\w-]+/g, '_')}.pdf`,
                    path: data.receiptPath,
                });
            }

            return await this.sendEmail({
                ...data,
                profile: 'EXHIBITOR',
                attachments
            });
        } catch (err) {
            console.error('sendPaymentDelayWarning error:', err.message);
            return false;
        }
    }

    /**
     * Send Installment Due Reminder Email
     * @param {Object} registration - Exhibitor registration object
     * @param {Object} installment - Installment details
     */

module.exports = sendPaymentDelayWarning;
