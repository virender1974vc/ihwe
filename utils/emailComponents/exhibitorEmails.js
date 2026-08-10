'use strict';
const fs = require('fs');
const QRCode = require('qrcode');
const whatsapp = require('../whatsapp');

async function sendRegistrationConfirmation(registration, pdfPath, rawPassword) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        let eventName = '9th Edition of International Health & Wellness Expo 2026 (IHWE Global Edition)';
        try {
            if (registration.eventId) {
                const Event = require('../../models/Event');
                const event = await Event.findById(registration.eventId).select('name');
                if (event?.name) eventName = event.name;
            }
        } catch (_) { }

        const data = {
            exhibitor_name: registration.exhibitorName,
            contact_person: `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim(),
            designation: registration.contact1.designation || 'N/A',
            stall_no: registration.participation?.stallFor || registration.participation?.stallNo || 'N/A',
            event_name: eventName,
            registrationId: registration.registrationId,
            login_url: loginUrl,
            username: registration.contact1.email,
            email: registration.contact1.email,
            password: rawPassword,
            phone: registration.contact1.mobile || registration.contact1.alternateNo,
            stall_scheme: registration.participation?.stallScheme || 'N/A',
            stall_dimension: registration.participation?.dimension || 'N/A',
            stall_size: registration.participation?.stallSize || 'N/A'
        };

        try {
            const template = await this.getTemplate('exhibitor-registration');
            if (!template) {
                console.warn('No dynamic template found for exhibitor-registration.');
                return false;
            }

            const subject = this.applyPlaceholders(template.emailSubject, data);
            const QR_TOKEN = '__QR_CODE_PLACEHOLDER__';
            let rawBody = template.emailBody.replace(/\[\[QR_CODE\]\]/g, QR_TOKEN);
            let bodyContent = this.applyPlaceholders(rawBody, data);
            let exhibitorQrBuffer = null;
            if (registration.registrationId) {
                const qrPayload = JSON.stringify({ registrationId: String(registration.registrationId).trim() });
                try {
                    const storedQr = String(registration.qrCode || '');
                    const base64Match = storedQr.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
                    exhibitorQrBuffer = base64Match
                        ? Buffer.from(base64Match[1], 'base64')
                        : await QRCode.toBuffer(qrPayload, {
                            width: 180,
                            margin: 2,
                            color: { dark: '#000000', light: '#ffffff' }
                        });
                    const qrBlock = `
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:6px 0;border:1px solid #dbe4d8;border-radius:6px;background:#f8fbf7;border-collapse:separate;">
                            <tr><td align="center" style="padding:6px 6px 3px;line-height:1.1;font-family:Arial,sans-serif;font-weight:700;color:#23471d;font-size:11px;text-transform:uppercase;letter-spacing:.6px;">EXHIBITOR ENTRY QR CODE</td></tr>
                            <tr><td align="center" style="padding:0;line-height:0;">
                                <img src="cid:exhibitor_entry_qr@ihwe.in" alt="Exhibitor Entry QR Code" width="96" height="96" style="display:block;width:96px;height:96px;margin:0 auto;border:2px solid #23471d;border-radius:4px;" />
                            </td></tr>
                            <tr><td align="center" style="padding:3px 6px 0;line-height:1.15;font-family:Arial,sans-serif;font-size:10px;color:#64748b;">Registration ID: <strong>${registration.registrationId}</strong></td></tr>
                            <tr><td align="center" style="padding:1px 6px 5px;line-height:1.15;font-family:Arial,sans-serif;font-size:9px;color:#94a3b8;">Use this same QR code at the venue and in your stall dashboard.</td></tr>
                        </table>`;
                    bodyContent = bodyContent.includes(QR_TOKEN)
                        ? bodyContent.replace(QR_TOKEN, qrBlock)
                        : bodyContent + qrBlock;
                } catch (qrError) {
                    console.error('[Exhibitor QR] Email QR generation failed:', qrError.message);
                }
            }
            bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');

            // Keep the registration email compact even when its editable DB
            // template contains legacy browser-default paragraph margins.
            bodyContent = bodyContent
                .replace(/line-height:\s*1\.6/gi, 'line-height:1.3')
                .replace(/<p>/gi, '<p style="margin:0 0 3px;line-height:1.3;">')
                .replace(/<p\s+style="/gi, '<p style="margin-top:0;')
                .replace(/margin:\s*20px\s+0/gi, 'margin:6px 0')
                .replace(/margin-bottom:\s*(?:25|20|15|12|10|8)px/gi, 'margin-bottom:3px')
                .replace(/padding:\s*25px/gi, 'padding:10px')
                .replace(/<ul([^>]*)style="([^"]*)margin-bottom:\s*20px;?/gi, '<ul$1style="$2margin-top:3px;margin-bottom:5px;')
                .replace(/<li([^>]*)style="([^"]*)margin-bottom:\s*8px;?/gi, '<li$1style="$2margin-bottom:2px;');

            // Tight rows inside Booking Details and Dashboard Access.
            bodyContent = bodyContent.replace(
                /<p\b([^>]*)>(\s*<strong>\s*(?:Registration ID:|Stall No\.:|Event Date:|Venue:|Login URL:|Username:)\s*<\/strong>)/gi,
                (_match, attributes, content) => {
                    const cleanAttributes = attributes.replace(/\s*style="[^"]*"/gi, '');
                    return `<p${cleanAttributes} style="margin:0 0 2px;line-height:1.2;font-size:12px;">${content}`;
                }
            );
            bodyContent = bodyContent.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (match, attributes, content) => {
                const text = content.replace(/<[^>]+>/g, '').replace(/&amp;/gi, '&').trim();
                const compactLine = /^(Dear\b|Greetings from\b|We are delighted\b|Thank you for choosing\b|Warm regards\b|Team IHWE 2026\b|Namo Gange Wellness Pvt\. Ltd\.?$)/i.test(text);
                if (!compactLine) return match;
                const cleanAttributes = attributes.replace(/\s*style="[^"]*"/gi, '');
                return `<p${cleanAttributes} style="margin:0 0 2px;line-height:1.25;">${content}</p>`;
            });
            bodyContent = bodyContent.replace(/padding:\s*10px/gi, 'padding:6px 8px');

            // Keep the About heading attached to its description. These styles
            // are inline because many email clients discard external CSS.
            bodyContent = bodyContent.replace(
                /<(p|h[1-6])\b([^>]*)>((?:(?!<\/(?:p|h[1-6])>)[\s\S])*About IHWE 2026:(?:(?!<\/(?:p|h[1-6])>)[\s\S])*)<\/\1>\s*<p\b([^>]*)>([\s\S]*?)<\/p>/i,
                (_match, headingTag, headingAttributes, headingContent, descriptionAttributes, descriptionContent) => {
                    const cleanHeadingAttributes = headingAttributes.replace(/\s*style="[^"]*"/gi, '');
                    const cleanDescriptionAttributes = descriptionAttributes.replace(/\s*style="[^"]*"/gi, '');
                    return `<${headingTag}${cleanHeadingAttributes} style="margin:0 0 1px;line-height:1.2;">${headingContent}</${headingTag}><p${cleanDescriptionAttributes} style="margin:0 0 4px;line-height:1.25;font-size:13px;color:#555555;">${descriptionContent}</p>`;
                }
            );

            // Present Booking Details and Dashboard Access together as two
            // equal, email-safe columns instead of two tall separate sections.
            const sectionPattern = (label) => new RegExp(
                `(<(?:p|h[1-6])\\b[^>]*>(?:(?!<\\/(?:p|h[1-6])>)[\\s\\S])*${label}(?:(?!<\\/(?:p|h[1-6])>)[\\s\\S])*<\\/(?:p|h[1-6])>)\\s*(<(?:div|blockquote)\\b[^>]*>[\\s\\S]*?<\\/(?:div|blockquote)>)`,
                'i'
            );
            const bookingMatch = bodyContent.match(sectionPattern('Booking Details:'));
            const dashboardMatch = bodyContent.match(sectionPattern('Dashboard Access:'));
            if (bookingMatch && dashboardMatch) {
                const innerContent = (wrapper) => wrapper
                    .replace(/^<(?:div|blockquote)\b[^>]*>/i, '')
                    .replace(/<\/(?:div|blockquote)>$/i, '');
                const combinedDetails = `
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:5px 0;border-collapse:separate;">
                        <tr>
                            <td class="registration-info-column" width="50%" valign="top" style="width:50%;padding:0 3px 0 0;">
                                <div style="height:100%;background:#fcfcfc;border:1px solid #e8ece8;border-radius:6px;padding:6px 8px;box-sizing:border-box;">
                                    <p style="margin:0 0 4px;line-height:1.2;font-size:12px;font-weight:700;color:#23471d;">📌 Booking Details</p>
                                    ${innerContent(bookingMatch[2])}
                                </div>
                            </td>
                            <td class="registration-info-column" width="50%" valign="top" style="width:50%;padding:0 0 0 3px;">
                                <div style="height:100%;background:#f9fafb;border:1px solid #e8ece8;border-radius:6px;padding:6px 8px;box-sizing:border-box;">
                                    <p style="margin:0 0 4px;line-height:1.2;font-size:12px;font-weight:700;color:#23471d;">🔗 Dashboard Access</p>
                                    ${innerContent(dashboardMatch[2])}
                                </div>
                            </td>
                        </tr>
                    </table>`;
                // Remove both sections from their old locations first, then put
                // the combined row immediately below the About IHWE paragraph.
                bodyContent = bodyContent.replace(dashboardMatch[0], '');
                bodyContent = bodyContent.replace(bookingMatch[0], '');
                const aboutSectionPattern = /(<(?:p|h[1-6])\b[^>]*>(?:(?!<\/(?:p|h[1-6])>)[\s\S])*About IHWE 2026:(?:(?!<\/(?:p|h[1-6])>)[\s\S])*<\/(?:p|h[1-6])>\s*<p\b[^>]*>[\s\S]*?<\/p>)/i;
                if (aboutSectionPattern.test(bodyContent)) {
                    bodyContent = bodyContent.replace(aboutSectionPattern, `$1${combinedDetails}`);
                } else {
                    bodyContent = `${combinedDetails}${bodyContent}`;
                }
            }

            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', '..', imgPath.replace(/^\//, ''));
                    if (!require('fs').existsSync(absPath)) return null;
                    return require('fs').readFileSync(absPath);
                } catch (e) { return null; }
            };

            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);

            if (registration.isGenericInvoice) {
                bodyContent = bodyContent.replace(/Stall Details/gi, 'Invoice Details');
                bodyContent = bodyContent.replace(/Stall No\./gi, 'Invoice No.');
                bodyContent = bodyContent.replace(/Stall Type/gi, 'Invoice Type');
                bodyContent = bodyContent.replace(/Scheme/g, 'Payment Type');
                bodyContent = bodyContent.replace(/Dimension/g, 'Doc Type');
                bodyContent = bodyContent.replace(/Stall Size/g, 'Qty');
                bodyContent = bodyContent.replace(/Rate \/ SQM/gi, 'Rate/Unit');
                bodyContent = bodyContent.replace(/SQM/g, '');
            }

            const html = this.emailShell(bodyContent, {
                headerCid: headerBuf ? 'email_header_img' : null,
                footerCid: footerBuf ? 'email_footer_img' : null,
                headerImage: template.headerImage || null,
                footerImage: template.footerImage || null,
                padding: '12px 18px',
                compactFooter: true,
            });

            const attachments = [];
            if (exhibitorQrBuffer) {
                attachments.push({
                    filename: `exhibitor-entry-${registration.registrationId}.png`,
                    content: exhibitorQrBuffer,
                    cid: 'exhibitor_entry_qr@ihwe.in'
                });
            }
            if (headerBuf) {
                const hExt = (template.headerImage || '').split('.').pop().toLowerCase() || 'png';
                attachments.push({ filename: `header.${hExt}`, content: headerBuf, cid: 'email_header_img' });
            }
            if (footerBuf) {
                const fExt = (template.footerImage || '').split('.').pop().toLowerCase() || 'png';
                attachments.push({ filename: `footer.${fExt}`, content: footerBuf, cid: 'email_footer_img' });
            }


            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);
            const sentToUser = await this.sendEmail({
                to: this.getExhibitorRecipient(registration),
                subject,
                html,
                attachments,
                profile: 'EXHIBITOR',
                logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: 'Registration Confirmation + PDF' }
            });

            const mobile = data.phone;
            if (mobile && whatsappContent) {
                this.trySendAisensyForFormType('exhibitor-registration', mobile, template, data).then(result => {
                    if (!result.success) {
                        return whatsapp.sendWhatsAppMessage(mobile, whatsappContent, 'Exhibitor Registration');
                    }
                }).catch(err => {
                    console.error('[WhatsApp] Exhibitor registration msg failed:', err.message);
                });
            }

            return sentToUser;
        } catch (error) {
            console.error('sendRegistrationConfirmation error:', error);
            return false;
        }
    }

async function sendPaymentReceipt(registration, pdfPath) {
        const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
        const fmt = (n) => `${cur === '$' ? 'USD' : 'INR'} ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const attachments = [];
        const fs = require('fs');
        const path = require('path');
        if (pdfPath && fs.existsSync(pdfPath)) {
            attachments.push({
                filename: `Payment_Receipt_${String(registration.registrationId || registration._id || 'IHWE').replace(/[^\w-]+/g, '_')}.pdf`,
                path: pdfPath
            });
        }
        let logoUrl = '';
        try {
            const Settings = require('../../models/Settings');
            const settings = await Settings.findOne().lean();
            if (settings) {
                const logoPath = settings.emailLogo || settings.logo;
                if (logoPath) {
                    const absLogoPath = path.resolve(__dirname, '..', '..', logoPath.replace(/^\//, ''));
                    if (fs.existsSync(absLogoPath)) {
                        attachments.push({
                            filename: path.basename(absLogoPath),
                            path: absLogoPath,
                            cid: 'website_logo_cid'
                        });
                        logoUrl = 'cid:website_logo_cid';
                    }
                }
            }
        } catch (settingsErr) {
            console.error('[sendPaymentReceipt] Settings query/attachment failed:', settingsErr.message);
        }

        if (!logoUrl) {
            logoUrl = 'https://www.ihwe.in/logo.png';
        }
        const addrParts = [];
        if (registration.address) addrParts.push(registration.address);
        if (registration.city) addrParts.push(registration.city);
        if (registration.state) addrParts.push(registration.state);
        if (registration.country) addrParts.push(registration.country);
        if (registration.pincode) addrParts.push(registration.pincode);
        const exhibitorAddress = addrParts.join(', ') || 'N/A';
        const paymentDateObj = (() => {
            const h = registration.paymentHistory || [];
            const l = h.length > 0 ? h[h.length - 1] : null;
            return (l && l.paidAt) ? new Date(l.paidAt) : new Date();
        })();
        const formattedPaymentDate = (() => {
            const pad = (n) => String(n).padStart(2, '0');
            const d = pad(paymentDateObj.getDate());
            const m = pad(paymentDateObj.getMonth() + 1);
            const y = paymentDateObj.getFullYear();
            let hours = paymentDateObj.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const mins = pad(paymentDateObj.getMinutes());
            return `${d}/${m}/${y} ${pad(hours)}:${mins} ${ampm}`;
        })();
        const formattedReceiptDate = (() => {
            const pad = (n) => String(n).padStart(2, '0');
            const d = pad(paymentDateObj.getDate());
            const m = pad(paymentDateObj.getMonth() + 1);
            const y = paymentDateObj.getFullYear();
            return `${d}/${m}/${y}`;
        })();


        const rateVal = registration.participation?.rate || 0;
        const sizeVal = registration.participation?.stallSize || 0;
        const calculatedAmount = rateVal * sizeVal;
        const fb = registration.financeBreakdown || {};
        const p = registration.participation || {};
        const stallDiscountAmount = fb.stallDiscountAmount || 0;
        const stallDiscountPercent = fb.stallDiscountPercent || 0;
        const discountAmount = fb.discountAmount || 0;
        const discountPercent = fb.discountPercent || 0;
        const grossAmount = fb.grossAmount || p.amount || calculatedAmount || 0;
        const subtotalVal = fb.subtotal || grossAmount || 0;
        const gstAmountVal = fb.gstAmount || Math.round(subtotalVal * 0.18);
        const tdsPercentVal = fb.tdsPercent || 0;
        const tdsAmountVal = fb.tdsAmount || 0;
        const netPayableVal = fb.netPayable || (subtotalVal + gstAmountVal - tdsAmountVal);
        const amountPaidVal = registration.amountPaid || 0;
        const balanceAmountVal = registration.balanceAmount || 0;

        let rowsHtml = '';


        rowsHtml += `
            <tr style="background-color: #ffffff;">
                <td width="230" style="padding: 1px 10px; font-size: 11px; line-height: 1.2; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-family: Arial, sans-serif;">
                    <strong>${registration.isGenericInvoice ? (p.stallType || 'Invoice') : (p.stallType || 'Shell Space')}</strong><br/>
                    <span style="font-size: 9px; color: #64748b;">${registration.isGenericInvoice ? 'Invoice No' : 'Stall Booking No'}: ${p.stallFor || 'N/A'}</span>
                </td>
                <td width="100" align="center" style="padding: 1px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #334155; font-family: Arial, sans-serif;">${p.dimension || 'N/A'}</td>
                <td width="100" align="center" style="padding: 1px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #334155; font-family: Arial, sans-serif;">${p.stallScheme || 'N/A'}</td>
                <td width="110" align="right" style="padding: 1px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #334155; font-family: Arial, sans-serif;">${fmt(rateVal)}</td>
                <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif;">${fmt(grossAmount)}</td>
            </tr>
        `;


        if (stallDiscountAmount > 0) {
            rowsHtml += `
                <tr>
                    <td width="330" colspan="2" style="background-color: #ffffff; border: 0;"></td>
                    <td width="210" colspan="2" align="right" style="padding: 1px 10px; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Stall Discount (${stallDiscountPercent}%)</td>
                    <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; color: #b45309; font-weight: bold; border-bottom: 1px solid #f1f5f9; white-space: nowrap; font-family: Arial, sans-serif;">- ${fmt(stallDiscountAmount)}</td>
                </tr>
            `;
        }

        if (discountAmount > 0) {
            rowsHtml += `
                <tr>
                    <td width="330" colspan="2" style="background-color: #ffffff; border: 0;"></td>
                    <td width="210" colspan="2" align="right" style="padding: 1px 10px; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Full Payment Discount (${discountPercent}%)</td>
                    <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; color: #b45309; font-weight: bold; border-bottom: 1px solid #f1f5f9; white-space: nowrap; font-family: Arial, sans-serif;">- ${fmt(discountAmount)}</td>
                </tr>
            `;
        }

        // 4. Taxable Value
        rowsHtml += `
            <tr>
                <td width="330" colspan="2" style="background-color: #ffffff; border: 0;"></td>
                <td width="210" colspan="2" align="right" style="padding: 1px 10px; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Taxable Value</td>
                <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; color: #0f172a; font-weight: bold; border-bottom: 1px solid #f1f5f9; white-space: nowrap; font-family: Arial, sans-serif;">${fmt(subtotalVal)}</td>
            </tr>
        `;

        // 5. GST @ 18%
        rowsHtml += `
            <tr>
                <td width="330" colspan="2" style="background-color: #ffffff; border: 0;"></td>
                <td width="210" colspan="2" align="right" style="padding: 1px 10px; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">GST @ 18%</td>
                <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; color: #0f172a; font-weight: bold; border-bottom: 1px solid #cbd5e1; white-space: nowrap; font-family: Arial, sans-serif;">${fmt(gstAmountVal)}</td>
            </tr>
        `;

        // 6. TDS Deduction (if any)
        if (tdsAmountVal > 0) {
            rowsHtml += `
                <tr>
                    <td width="330" colspan="2" style="background-color: #ffffff; border: 0;"></td>
                    <td width="210" colspan="2" align="right" style="padding: 1px 10px; font-size: 11px; color: #64748b; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">TDS Deduction (${tdsPercentVal}%)</td>
                    <td width="160" align="right" style="padding: 1px 10px; font-size: 11px; color: #dc2626; font-weight: bold; border-bottom: 1px solid #cbd5e1; white-space: nowrap; font-family: Arial, sans-serif;">- ${fmt(tdsAmountVal)}</td>
                </tr>
            `;
        }

        // 7. GRAND TOTAL / NET PAYABLE
        rowsHtml += `
            <tr style="background-color: #0c2b5c; color: #ffffff;">
                <td width="330" colspan="2" style="border: 0; background-color: #ffffff;"></td>
                <td width="210" colspan="2" align="right" style="padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; white-space: nowrap; color: #ffffff; font-family: Arial, sans-serif;">GRAND TOTAL</td>
                <td width="160" align="right" style="padding: 2px 10px; font-size: 12px; font-weight: bold; white-space: nowrap; color: #ffffff; font-family: Arial, sans-serif;">${fmt(netPayableVal)}</td>
            </tr>
        `;

        // 8. PARTIAL PAYMENT SUMMARY (if any balance or if amountPaid is different from netPayable)
        if (balanceAmountVal > 0 || amountPaidVal < netPayableVal) {
            rowsHtml += `
                <tr style="background-color: #f0fdf4;">
                    <td width="330" colspan="2" style="border: 0; background-color: #ffffff;"></td>
                    <td width="210" colspan="2" align="right" style="padding: 2px 10px; font-size: 11px; color: #15803d; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Amount Received</td>
                    <td width="160" align="right" style="padding: 2px 10px; font-size: 11px; color: #15803d; font-weight: bold; border-bottom: 1px solid #cbd5e1; white-space: nowrap; font-family: Arial, sans-serif;">${fmt(amountPaidVal)}</td>
                </tr>
                <tr style="background-color: #fef2f2;">
                    <td width="330" colspan="2" style="border: 0; background-color: #ffffff;"></td>
                    <td width="210" colspan="2" align="right" style="padding: 2px 10px; font-size: 11px; color: #b91c1c; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif;">Balance Due</td>
                    <td width="160" align="right" style="padding: 2px 10px; font-size: 11px; color: #b91c1c; font-weight: bold; border-bottom: 1px solid #cbd5e1; white-space: nowrap; font-family: Arial, sans-serif;">${fmt(balanceAmountVal)}</td>
                </tr>
            `;
        }

        // Build contact person name (exhibitor's person name, not company)
        const contactPersonName = `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim() || registration.contact1.firstName || 'N/A';

        // Relationship Manager = spokenWith (admin selected) → referredBy → Direct
        const relationshipMgr = (registration.spokenWith && registration.spokenWith.trim())
            ? registration.spokenWith.trim()
            : (registration.referredBy && registration.referredBy.trim())
                ? registration.referredBy.trim()
                : 'Direct';

        const toTitleCase = (str) => {
            if (!str) return '';
            return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
        };

        const data = {
            site_url: (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, ''),
            logo_url: logoUrl,
            exhibitor_name: toTitleCase(registration.exhibitorName),
            contact_person: contactPersonName,
            designation: registration.contact1.designation || 'N/A',
            registrationId: registration.registrationId,
            stall_no: registration.participation?.stallFor || 'N/A',
            stall_type: registration.participation?.stallType || 'N/A',
            total_amount: fmt(netPayableVal),
            amount_paid: fmt(amountPaidVal),
            balance_due: fmt(balanceAmountVal),
            payment_mode: registration.paymentMode === 'online' ? 'Online' : 'Bank Transfer',
            payment_method: (() => { const h = registration.paymentHistory || []; const l = h.length > 0 ? h[h.length - 1] : null; return (l && l.method) || registration.manualPaymentDetails?.method || (registration.paymentMode === 'online' ? 'Razorpay' : 'Bank Transfer'); })(),
            transaction_id: (() => { const h = registration.paymentHistory || []; const l = h.length > 0 ? h[h.length - 1] : null; return (l && (l.transactionId || l.razorpayPaymentId)) || registration.manualPaymentDetails?.transactionId || registration.paymentId || 'N/A'; })(),
            stall_scheme: registration.participation?.stallScheme || 'N/A',
            stall_dimension: registration.participation?.dimension || 'N/A',
            stall_size: registration.participation?.stallSize || 'N/A',
            exhibitor_address: toTitleCase(exhibitorAddress),
            exhibitor_gstin: registration.gstNo || 'N/A',
            exhibitor_cin: registration.businessRegistrationNo || registration.panNo || 'N/A',
            exhibitor_email: registration.contact1.email || 'N/A',
            exhibitor_contact: registration.contact1.mobile || 'N/A',
            receipt_no: `IHWE-RCPT-2026-${(registration.registrationId || '').split('-').pop() || '0000'}`,
            receipt_date: formattedReceiptDate,
            payment_date: formattedPaymentDate,
            rate_per_sqm: fmt(rateVal),
            stall_amount: fmt(grossAmount),
            taxable_value: fmt(subtotalVal),
            gst_amount: fmt(gstAmountVal),
            payment_status: balanceAmountVal <= 0 ? 'Full Received' : 'Advance Received',
            financial_table_rows: rowsHtml,
            referred_by: toTitleCase(relationshipMgr),
            exhibitor_company_type: registration.typeOfBusiness || 'Private Ltd. Company'
        };

        if (registration.paymentMode !== 'online') {
            const rPath = registration.receiptUrl;
            if (rPath) {
                const cleanPath = rPath.replace(/^(https?:\/\/[^\/]+)?\/?/, '');
                if (fs.existsSync(cleanPath)) {
                    attachments.push({
                        filename: path.basename(cleanPath),
                        path: cleanPath
                    });
                } else if (fs.existsSync(rPath)) {
                    attachments.push({
                        filename: path.basename(rPath),
                        path: rPath
                    });
                }
            }
        }

        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-payment-receipt',
            data,
            profile: 'EXHIBITOR',
            attachments,
            notifyAdmin: false
        });
        await this.sendPaymentReceiptAdminAlert(registration);
        return userResult;
    }

async function sendFullPaymentWelcomeEmail(registration) {
        const ExhibitorPassConfig = require('../../models/ExhibitorPassConfig');
        const Stall = require('../../models/Stall');
        const Settings = require('../../models/Settings');
        const { computeEntitlement, computeVehicleEntitlements } = require('../entitlementCalculator');

        const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
        const fmt = (n) => `${cur}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const toTitleCase = (str) => !str ? '' : str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

        const fb = registration.financeBreakdown || {};
        const netPayableVal = fb.netPayable || registration.participation?.total || 0;
        const tdsAmountVal = fb.tdsAmount || 0;
        const amountPaidVal = registration.amountPaid || 0;
        const balanceAmountVal = registration.balanceAmount || 0;

        const lastPayment = (() => {
            const h = registration.paymentHistory || [];
            return h.length > 0 ? h[h.length - 1] : null;
        })();
        const formattedPaymentDate = (() => {
            const d = lastPayment?.paidAt ? new Date(lastPayment.paidAt) : new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${pad(d.getDate())} ${d.toLocaleString('en-IN', { month: 'long' })} ${d.getFullYear()}`;
        })();

        const contactPersonName = `${registration.contact1?.title || ''} ${registration.contact1?.firstName || ''} ${registration.contact1?.lastName || ''}`.trim() || 'N/A';

        // Stall position (e.g. "Corner Stall (3 Side Open)") is derived from the real
        // plScheme on the booked Stall document — there is no separate "position" field.
        let stallPosition = 'N/A';
        try {
            if (registration.participation?.stallNo) {
                const stall = await Stall.findById(registration.participation.stallNo).select('plScheme').lean();
                if (stall?.plScheme) {
                    const label = { 'One Side Open': 'Standard Stall', 'Two Side Open': 'Corner Stall', 'Three Side Open': 'Corner Stall', 'Four Side Open': 'Island Stall' }[stall.plScheme] || 'Stall';
                    stallPosition = `${label} (${stall.plScheme})`;
                }
            }
        } catch (_) { }

        // Pass entitlements are computed from the live ExhibitorPassConfig against this
        // exhibitor's booked stall area — same calculation used by the exhibitor dashboard,
        // so the counts shown here always match what the exhibitor can actually claim.
        let passesRowsHtml = '';
        try {
            const stallArea = Number(registration.participation?.stallSize) || 0;
            const configs = await ExhibitorPassConfig.find({ isActive: true, passType: { $in: ['visitor', 'service', 'exhibitor'] } }).lean();
            const passItems = configs.map(config => ({
                title: config.title || `${toTitleCase(config.passType)} Passes`,
                qty: computeEntitlement({
                    allocationMode: config.allocationMode,
                    ratioQty: config.ratioQty,
                    ratioArea: config.ratioArea,
                    roundingMode: config.roundingMode,
                    fixedQty: config.complimentaryQuota
                }, stallArea)
            }));
            const vehicleConfig = await ExhibitorPassConfig.findOne({ passType: 'vehicle', isActive: true }).lean();
            if (vehicleConfig) {
                const veh = computeVehicleEntitlements(vehicleConfig, stallArea);
                const totalVehicle = (veh.twoWheeler || 0) + (veh.fourWheeler || 0);
                if (totalVehicle > 0) passItems.push({ title: 'Vehicle Passes', qty: totalVehicle });
            }
            passesRowsHtml = passItems
                .filter(item => item.qty > 0)
                .map(item => `<li style="margin-bottom:3px;">${item.qty} ${item.title}</li>`)
                .join('');
        } catch (err) {
            console.error('[sendFullPaymentWelcomeEmail] Pass entitlement calc failed:', err.message);
        }
        if (!passesRowsHtml) passesRowsHtml = '<li>As per your booked package — contact your Relationship Manager for details.</li>';

        const entitlements = registration.entitlements || {};
        const hospitalityText = (entitlements.lunchCount || entitlements.waterBottleCount)
            ? `${entitlements.lunchCount || 0} Lunches + ${entitlements.waterBottleCount || 0} Water Bottles per day for all 3 days of the event.`
            : '2 Lunches + 2 Water Bottles per day for all 3 days of the event.';

        const isShellScheme = /shell/i.test(registration.participation?.stallType || '');
        const inclusionsBlockHtml = isShellScheme ? `
            <div style="font-size:9px;font-weight:bold;color:#0c2b5c;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 3px;font-family:Arial,sans-serif;">Shell Scheme Inclusions</div>
            <ul style="margin:0;padding-left:13px;font-size:10px;color:#334155;font-family:Arial,sans-serif;line-height:1.4;">
                <li>Fascia Name Board</li>
                <li>Carpet</li>
                <li>3 Spot Lights</li>
                <li>1 Table</li>
                <li>2 Chairs</li>
                <li>1 Power Point</li>
                <li>Dustbin</li>
            </ul>` : '';

        let settings = null;
        try {
            settings = await Settings.findOne().lean();
        } catch (settingsErr) {
            console.error('[sendFullPaymentWelcomeEmail] Settings query failed:', settingsErr.message);
        }

        // Hall No. is not a stored field — it follows the same convention already used
        // by the accounts module (paymentController.js): an "H<n>" prefix on the stall number.
        const rawStallNo = String(registration.participation?.stallFor || registration.participation?.stallNo || '');
        const hallMatch = rawStallNo.match(/^H(\d+)/i);
        const hallNo = hallMatch ? hallMatch[1] : '';

        const siteUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
        const loginUrl = `${siteUrl}/exhibitor-login`;

        // The event header is a full banner image (same mechanism as every other
        // exhibitor email: template.headerImage, uploaded via the CMS) rather than
        // hand-built HTML — an admin uploads the exact banner for this formType there.

        // NOTE: values here are interpolated directly (not via [[PLACEHOLDER]] tokens) —
        // this HTML is itself inserted into the template through a placeholder, and
        // applyPlaceholders only does a single pass, so a nested [[TOKEN]] introduced
        // by the replacement text would never get resolved.
        const headOfficeAddress = settings?.companyAddress || 'Namo Gange Wellness Pvt. Ltd., 12/52, Site-2, Loni Road Industrial Area, Mohan Nagar, Ghaziabad-201007, Uttar Pradesh, India';
        const footerBlockHtml = `
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:1px solid #e2e8f0;margin-top:4px;"><tr>
                <td style="padding:10px 4px 4px;font-family:Arial,sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
                        <td style="font-size:10px;color:#64748b;">
                            <strong style="color:#334155;">HEAD OFFICE:</strong> ${headOfficeAddress}
                        </td>
                        <td align="right" style="font-size:10px;color:#94a3b8;white-space:nowrap;padding-left:10px;">FOLLOW US ON &nbsp;
                            <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:#1877f2;color:#fff;border-radius:50%;font-size:9px;font-weight:bold;font-family:Arial,sans-serif;">f</span>
                            <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:#e1306c;color:#fff;border-radius:50%;font-size:9px;font-weight:bold;font-family:Arial,sans-serif;">i</span>
                            <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:#0a66c2;color:#fff;border-radius:50%;font-size:9px;font-weight:bold;font-family:Arial,sans-serif;">in</span>
                            <span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:#ff0000;color:#fff;border-radius:50%;font-size:9px;font-weight:bold;font-family:Arial,sans-serif;">&#9654;</span>
                        </td>
                    </tr></table>
                </td>
            </tr></table>`;

        const downloadCard = (title, description, url, accentColor) => `
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc;margin-bottom:10px;">
                <tr><td style="padding:10px 12px;font-family:Arial,sans-serif;">
                    <table role="presentation" width="100%"><tr>
                        <td valign="middle">
                            <div style="font-size:11px;font-weight:bold;color:${accentColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">${title}</div>
                            <div style="font-size:10px;color:#64748b;line-height:1.4;max-width:150px;">${description}</div>
                        </td>
                        <td valign="middle" align="right">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
                                <td bgcolor="${accentColor}" style="background:${accentColor};border-radius:4px;padding:8px 14px;" align="center">
                                    <a href="${url}" style="font-family:Arial,sans-serif;color:#ffffff;text-decoration:none;font-size:10px;font-weight:bold;letter-spacing:0.3px;white-space:nowrap;">DOWNLOAD</a>
                                </td>
                            </tr></table>
                        </td>
                    </tr></table>
                </td></tr>
            </table>`;
        const downloadButtonsHtml = [
            registration.registrationPdfUrl ? downloadCard('Proforma Invoice', 'You can download your Proforma Invoice for future reference.', registration.registrationPdfUrl, '#0c2b5c') : '',
            registration.receiptPdfUrl ? downloadCard('Payment Receipt', 'You can download your Payment Receipt for future reference.', registration.receiptPdfUrl, '#23471d') : ''
        ].join('');

        const relationshipMgr = (registration.spokenWith && registration.spokenWith.trim())
            ? registration.spokenWith.trim()
            : (registration.referredBy && registration.referredBy.trim())
                ? registration.referredBy.trim()
                : 'Team IHWE';

        const data = {
            site_url: siteUrl,
            footer_block: footerBlockHtml,
            exhibitor_name: toTitleCase(registration.exhibitorName),
            contact_person: contactPersonName,
            registrationId: registration.registrationId,
            pi_no: `PI/26-27/${(registration.registrationId || '').split('-').pop() || '0000'}`,
            booking_amount: fmt(netPayableVal),
            tds_deducted: fmt(tdsAmountVal),
            net_payable: fmt(netPayableVal),
            amount_paid: fmt(amountPaidVal),
            balance_due: fmt(balanceAmountVal),
            payment_status: balanceAmountVal <= 0 ? 'FULLY PAID' : 'PARTIALLY PAID',
            payment_date: formattedPaymentDate,
            stall_no: registration.participation?.stallFor || 'N/A',
            hall_no: hallNo || 'As allotted at the venue',
            stall_type: registration.participation?.stallType || 'N/A',
            stall_scheme: registration.participation?.stallScheme || 'N/A',
            stall_size: registration.participation?.stallSize || 'N/A',
            stall_position: stallPosition,
            inclusions_block: inclusionsBlockHtml,
            hospitality_text: hospitalityText,
            passes_rows: passesRowsHtml,
            download_buttons: downloadButtonsHtml,
            register_delegates_url: `${siteUrl}/delegate-registration`,
            register_buyer_seller_url: `${siteUrl}/buyer-seller-meet`,
            login_url: loginUrl,
            username: registration.contact1?.email || 'N/A',
            rm_name: toTitleCase(relationshipMgr),
            rm_phone: settings?.contactPhone || 'N/A',
            rm_email: settings?.contactEmail || 'N/A',
            accounts_phone: process.env.ACCOUNTS_SUPPORT_PHONE || settings?.contactPhone || 'N/A',
            accounts_email: process.env.ACCOUNTS_SUPPORT_EMAIL || settings?.contactEmail || 'N/A',
            helpline_phone: process.env.EXHIBITOR_HELPLINE_PHONE || settings?.contactPhone || 'N/A',
            helpline_email: process.env.EXHIBITOR_HELPLINE_EMAIL || settings?.contactEmail || 'N/A'
        };

        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-full-payment-welcome',
            data,
            profile: 'EXHIBITOR',
            notifyAdmin: false
        });
        return userResult;
    }

async function sendApprovalEmail(registration) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        const contactPerson = `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim();
        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-registration-approved',
            data: {
                exhibitor_name: registration.exhibitorName,
                contact_person: contactPerson,
                contact1FirstName: registration.contact1.firstName,
                name: contactPerson,
                stall_no: registration.participation?.stallFor || 'N/A',
                event_name: registration.eventId?.name || 'IHWE 2026',
                registrationId: registration.registrationId,
                login_url: loginUrl,
                username: registration.contact1.email,
                password: 'Check your previous registration email',
                email: registration.contact1.email,
                status: 'Approved',
                phone: registration.contact1.mobile
            },
            profile: 'EXHIBITOR',
            notifyAdmin: false
        });
        await this.sendRegistrationApprovedAdminAlert(registration);
        return userResult;
    }

async function sendConfirmationEmail(registration) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        const contactPerson = `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim();

        const data = {
            exhibitor_name: registration.exhibitorName,
            contact_person: contactPerson,
            contact1FirstName: registration.contact1.firstName,
            name: contactPerson,
            registrationId: registration.registrationId,
            stall_no: registration.participation?.stallFor || 'N/A',
            stall_type: registration.participation?.stallType || 'N/A',
            event_name: registration.eventId?.name || 'IHWE 2026',
            login_url: loginUrl,
            phone: registration.contact1.mobile
        };

        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-booking-confirmed',
            data,
            profile: 'EXHIBITOR',
            notifyAdmin: false
        });
        await this.sendBookingConfirmedAdminAlert(registration);
        return userResult;
    }

async function sendRejectionEmail(registration) {
        const contactPerson = `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim();
        const data = {
            exhibitor_name: registration.exhibitorName,
            contact_person: contactPerson,
            contact1FirstName: registration.contact1.firstName,
            name: contactPerson,
            registrationId: registration.registrationId,
            event_name: 'IHWE 2026',
            phone: registration.contact1.mobile
        };

        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-registration-rejection',
            data,
            profile: 'EXHIBITOR',
            notifyAdmin: false
        });
        await this.sendRejectionAdminAlert(registration);
        return userResult;
    }

async function sendPaymentFailedEmail(registration) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        const contactPerson = `${registration.contact1.title || ''} ${registration.contact1.firstName || ''} ${registration.contact1.lastName || ''}`.trim();
        const data = {
            exhibitor_name: registration.exhibitorName,
            contact_person: contactPerson,
            contact1FirstName: registration.contact1.firstName,
            name: contactPerson,
            registrationId: registration.registrationId,
            stall_no: registration.participation?.stallFor || 'N/A',
            login_url: loginUrl,
            phone: registration.contact1.mobile
        };
        const userResult = await this.sendDynamicConfirmation({
            to: this.getExhibitorRecipient(registration),
            formType: 'exhibitor-payment-failed',
            data,
            profile: 'EXHIBITOR',
            notifyAdmin: false
        });
        await this.sendPaymentFailedAdminAlert(registration);
        return userResult;
    }

module.exports = { sendRegistrationConfirmation, sendPaymentReceipt, sendFullPaymentWelcomeEmail, sendApprovalEmail, sendConfirmationEmail, sendRejectionEmail, sendPaymentFailedEmail };
