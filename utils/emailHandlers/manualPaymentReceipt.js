'use strict';

async function sendManualPaymentReceipt(email, data) {
        if (!email) return false;
        try {
            const attachments = [];
            if (data.receiptPath && require('fs').existsSync(data.receiptPath)) {
                attachments.push({
                    filename: `Payment_Receipt_${String(data.reference || 'IHWE').replace(/[^\w-]+/g, '_')}.pdf`,
                    path: data.receiptPath,
                });
            }

            const html = `
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea;">
                    <h2 style="color: #194090; margin-top: 0; text-align: center; border-bottom: 2px solid #f0f4fa; padding-bottom: 15px;">Payment Received ✅</h2>
                    <p style="color: #333333; font-size: 16px;">Dear <strong>${data.name}</strong>,</p>
                    <p style="color: #555555; font-size: 15px; line-height: 1.6;">Thank you for your payment! We have successfully received your payment for the 9th India Health & Wellness Expo (IHWE).</p>
                    
                    <div style="background-color: #f8fbff; border: 1px solid #d4e4fc; border-radius: 6px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #194090; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Payment Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;">Amount:</td>
                                <td style="padding: 8px 0; color: #111; font-size: 15px; font-weight: bold;">₹${data.amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-size: 14px;">Payment Mode:</td>
                                <td style="padding: 8px 0; color: #111; font-size: 15px; font-weight: bold;">${data.mode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-size: 14px;">Date:</td>
                                <td style="padding: 8px 0; color: #111; font-size: 15px; font-weight: bold;">${data.date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-size: 14px;">Reference No:</td>
                                <td style="padding: 8px 0; color: #111; font-size: 15px; font-weight: bold;">${data.reference}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #555555; font-size: 14px; line-height: 1.6;">Your payment has been successfully recorded against your company: <strong>${data.companyName}</strong>.</p>
                    <p style="color: #555555; font-size: 14px; line-height: 1.6;">If you have any questions or concerns, please feel free to reach out to us by replying to this email.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 25px 0;" />
                    <p style="color: #888888; font-size: 13px; margin: 0;">Warm Regards,</p>
                    <p style="color: #194090; font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">Team 9th IHWE</p>
                    <p style="color: #888888; font-size: 12px; margin: 2px 0 0 0;">India Health & Wellness Expo</p>
                </div>
            `;

            return await this.sendEmail({
                to: email,
                subject: "Payment Received ✅ - 9th IHWE",
                html,
                profile: 'EXHIBITOR',
                attachments
            });
        } catch (err) {
            console.error('sendManualPaymentReceipt Email error:', err.message);
            return false;
        }
    }

module.exports = sendManualPaymentReceipt;
