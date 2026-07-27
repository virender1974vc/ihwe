'use strict';

async function sendInstallmentReminder(registration, installment) {
        try {
            const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
            const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

            const html = this.emailShell(`
                <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
                            <tr>
                                <td align="center" style="padding-bottom: 20px;">
                                    <span style="font-size: 48px;">📅</span>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding-bottom: 30px;">
                                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #f59e0b;">
                                        INSTALLMENT DUE REMINDER
                                    </h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-bottom: 20px;">
                                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">
                                        Dear <strong>${registration.contact1?.firstName || 'Customer'}</strong>,
                                    </p>
                                    <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
                                        Your <strong>${installment.label || 'installment'}</strong> payment is due. Please complete your payment to avoid any late fees.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 20px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Installment:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${installment.label || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                                            <td style="padding: 8px 0; color: #f59e0b; font-size: 18px; font-weight: 700; text-align: right;">${fmt(installment.dueAmount || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
                                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 30px 0;">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/exhibitor/payment/${registration._id}" 
                                       style="display: inline-block; padding: 16px 40px; background-color: #f59e0b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px;">
                                        💳 PAY NOW
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `);

            const data = {
                to: registration.contact1?.email,
                subject: `📅 ${installment.label || 'Installment'} Due - ${registration.exhibitorName}`,
                html
            };

            return await this.sendEmail({
                ...data,
                profile: 'EXHIBITOR'
            });
        } catch (err) {
            console.error('sendInstallmentReminder error:', err.message);
            return false;
        }
    }

module.exports = sendInstallmentReminder;
