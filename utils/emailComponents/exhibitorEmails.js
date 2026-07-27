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
                        <div style="text-align:center;margin:24px 0;padding:18px;border:1px solid #dbe4d8;border-radius:10px;background:#f8fbf7;">
                            <p style="font-weight:700;color:#23471d;margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Exhibitor Entry QR Code</p>
                            <img src="cid:exhibitor_entry_qr@ihwe.in" alt="Exhibitor Entry QR Code" width="150" height="150" style="display:inline-block;border:4px solid #23471d;border-radius:8px;" />
                            <p style="margin:9px 0 0;font-size:12px;color:#64748b;">Registration ID: <strong>${registration.registrationId}</strong></p>
                            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Use this same QR code at the venue and in your stall dashboard.</p>
                        </div>`;
                    bodyContent = bodyContent.includes(QR_TOKEN)
                        ? bodyContent.replace(QR_TOKEN, qrBlock)
                        : bodyContent + qrBlock;
                } catch (qrError) {
                    console.error('[Exhibitor QR] Email QR generation failed:', qrError.message);
                }
            }
            bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');

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

module.exports = { sendRegistrationConfirmation, sendPaymentReceipt, sendApprovalEmail, sendConfirmationEmail, sendRejectionEmail, sendPaymentFailedEmail };
