'use strict';

async function sendAccessoryOrderEmail(registration, order, pdfPath) {
        try {
            const resolvedRegistration = await this.resolveAccessoryNotificationRegistration(registration);
            const contact = resolvedRegistration.contact1 || {};
            const email = contact.email || '';
            const mobile = String(contact.whatsapp || contact.mobile || '').trim();

            const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

            console.log('[AccessoryNotification] Resolved recipient:', {
                orderNo: order.orderNo,
                registrationId: resolvedRegistration.registrationId || null,
                exhibitorId: resolvedRegistration._id || null,
                email: email || null,
                mobile: mobile || null
            });

            const itemRows = order.items.map((item, i) => `
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:8px 12px;font-size:13px;">${i + 1}. ${item.name}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:center;">${item.qty}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:center;color:${item.type === 'complimentary' ? '#16a34a' : '#d26019'};font-weight:700;">${item.type === 'complimentary' ? 'FREE' : 'Paid'}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:700;">${item.type === 'complimentary' ? 'Complimentary' : fmt(item.totalPrice)}</td>
                </tr>
            `).join('');

            const itemTable = `
                <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
                    <thead>
                        <tr style="background:#23471d;color:#fff;">
                            <th style="padding:10px 12px;text-align:left;font-size:12px;">Item</th>
                            <th style="padding:10px 12px;text-align:center;font-size:12px;">Qty</th>
                            <th style="padding:10px 12px;text-align:center;font-size:12px;">Type</th>
                            <th style="padding:10px 12px;text-align:right;font-size:12px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
            `;

            const data = {
                exhibitor_name: resolvedRegistration.exhibitorName,
                contact_person: `${contact.title || ''} ${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                designation: contact.designation || 'N/A',
                mobile,
                phone: mobile,
                whatsapp: mobile,
                registrationId: resolvedRegistration.registrationId,
                order_no: order.orderNo,
                stall_no: resolvedRegistration.participation?.stallFor || 'N/A',
                grand_total: order.paymentStatus === 'complimentary' ? 'Complimentary' : fmt(order.grandTotal),
                item_table: itemTable,
            };

            const attachments = [];
            if (pdfPath && require('fs').existsSync(pdfPath)) {
                attachments.push({ filename: `Accessory_Receipt_${order.orderNo}.pdf`, path: pdfPath });
            }

            // Try the dynamic template-based path first
            const templateResult = await this.sendDynamicConfirmation({
                to: email,
                formType: 'exhibitor-accessory-order',
                data,
                profile: 'EXHIBITOR',
                attachments,
                notifyAdmin: false
            });

            if (templateResult) {
                await this.sendAccessoryOrderAdminAlert(resolvedRegistration, order);
                return templateResult;
            }

            // --- FALLBACK: No template in DB — send direct email + WhatsApp ---
            console.warn('[sendAccessoryOrderEmail] No template found. Using direct fallback.');
            const tasks = [];

            if (email) {
                const contactPerson = data.contact_person || resolvedRegistration.exhibitorName;
                const fallbackHtml = this.emailShell(`
                    <tr>
                        <td style="padding:30px 30px;background:#ffffff;font-family:Arial,sans-serif;">
                            <p style="font-size:16px;font-weight:700;color:#23471d;margin:0 0 12px;">Dear ${contactPerson},</p>
                            <p style="font-size:14px;color:#374151;margin:0 0 16px;">Thank you for your stall accessories order. Your payment has been received successfully.</p>
                            <table style="width:100%;border-collapse:collapse;margin:0 0 16px;border:1px solid #e5e7eb;">
                                <tr><td style="padding:8px 14px;font-size:13px;font-weight:700;color:#6b7280;background:#f9fafb;width:160px;">Order No</td><td style="padding:8px 14px;font-size:13px;color:#111827;">${order.orderNo}</td></tr>
                                <tr><td style="padding:8px 14px;font-size:13px;font-weight:700;color:#6b7280;background:#f9fafb;">Exhibitor</td><td style="padding:8px 14px;font-size:13px;color:#111827;">${resolvedRegistration.exhibitorName}</td></tr>
                                <tr><td style="padding:8px 14px;font-size:13px;font-weight:700;color:#6b7280;background:#f9fafb;">Amount Paid</td><td style="padding:8px 14px;font-size:13px;color:#16a34a;font-weight:700;">${data.grand_total}</td></tr>
                            </table>
                            <p style="font-size:13px;font-weight:700;color:#23471d;margin:0 0 8px;">Items Ordered:</p>
                            ${itemTable}
                            <p style="font-size:13px;color:#6b7280;margin:16px 0 0;">For any queries, please contact our team. Thank you for exhibiting with IHWE 2026!</p>
                        </td>
                    </tr>
                `);

                tasks.push(
                    this.sendEmail({
                        to: email,
                        subject: `Stall Accessories Order Confirmed — Order No: ${order.orderNo}`,
                        html: fallbackHtml,
                        attachments,
                        profile: 'EXHIBITOR',
                        logData: { name: contactPerson, phone: mobile, message: `Accessory order fallback email (${order.orderNo})` }
                    }).catch(err => {
                        console.error('[sendAccessoryOrderEmail] Fallback email failed:', err.message);
                        return false;
                    })
                );
            } else {
                console.warn('[sendAccessoryOrderEmail] Fallback skipped: no email address found');
            }

            if (mobile) {
                const whatsappService = require('../whatsappService');
                const normalizeIndianMobile = (val) => {
                    const digits = String(val || '').replace(/\D/g, '');
                    if (/^[6-9]\d{9}$/.test(digits)) return digits;
                    if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(-10);
                    if (/^0[6-9]\d{9}$/.test(digits)) return digits.slice(1);
                    return '';
                };
                const normalizedMobile = normalizeIndianMobile(mobile);
                if (normalizedMobile) {
                    tasks.push(
                        whatsappService.sendPaymentConfirmation(normalizedMobile, {
                            contactPerson: data.contact_person,
                            registrationId: resolvedRegistration.registrationId,
                            amountPaid: order.grandTotal,
                            transactionId: order.transactionId,
                            companyName: process.env.COMPANY_NAME || 'IHWE'
                        }).catch(err => {
                            console.error('[sendAccessoryOrderEmail] Fallback WhatsApp failed:', err.message);
                        })
                    );
                }
            } else {
                console.warn('[sendAccessoryOrderEmail] Fallback WhatsApp skipped: no mobile found');
            }

            if (tasks.length > 0) await Promise.allSettled(tasks);
            await this.sendAccessoryOrderAdminAlert(resolvedRegistration, order);
            return true;
        } catch (err) {
            console.error('sendAccessoryOrderEmail error:', err.message);
            return false;
        }
    }

module.exports = sendAccessoryOrderEmail;
