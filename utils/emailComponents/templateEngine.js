'use strict';
const fs = require('fs');
const QRCode = require('qrcode');
const whatsapp = require('../whatsapp');
const aisensy = require('../aisensyService');
const { AISENSY_CAMPAIGN_BY_FORM_TYPE, AISENSY_BANNER_BY_FORM_TYPE } = require('./aisensyConfig');
const { getCorporateVisitorAdminAlertTemplate } = require('../emailTemplates/corporateVisitorAdminAlert');
const { getGeneralVisitorAdminAlertTemplate } = require('../emailTemplates/generalVisitorAdminAlert');
const { getGeneralEnquiryAdminAlertTemplate } = require('../emailTemplates/generalEnquiryAdminAlert');

async function getTemplate(formType) {
        try {
            const MessageTemplate = require('../../models/MessageTemplate');
            return await MessageTemplate.findOne({ formType });
        } catch (error) {
            console.error('Error fetching template for ' + formType + ':', error);
            return null;
        }
    }

async function getExhibitorTemplateData() {
        try {
            const template = await this.getTemplate('exhibitor-registration');
            if (!template) return null;

            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const fs = require('fs');
                    const absPath = require('path').resolve(__dirname, '..', '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) return null;
                    return fs.readFileSync(absPath);
                } catch (e) { return null; }
            };

            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);

            const attachments = [];
            if (headerBuf) {
                const ext = (template.headerImage || '').split('.').pop().toLowerCase() || 'png';
                attachments.push({ filename: `header.${ext}`, content: headerBuf, cid: 'email_header_img' });
            }
            if (footerBuf) {
                const ext = (template.footerImage || '').split('.').pop().toLowerCase() || 'png';
                attachments.push({ filename: `footer.${ext}`, content: footerBuf, cid: 'email_footer_img' });
            }

            return {
                headerImage: template.headerImage,
                footerImage: template.footerImage,
                headerCid: headerBuf ? 'email_header_img' : null,
                footerCid: footerBuf ? 'email_footer_img' : null,
                attachments
            };
        } catch (e) { return null; }
    }

function resolvePlaceholderValue(key, data) {
        const aliases = {
            'NAME': data.fullName || data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : ''),
            'REG_ID': data.registrationId || data.regId || data.REG_ID || 'N/A',
            'SERVICE': data.service || data.proposedTopic || data.topic || 'IHWE Services',
            'COMPANY': data.companyName || data.company || data.organization || data.organizationName || 'N/A',
            'CATEGORY': data.category || data.registrationCategory || 'N/A',
            'EMAIL': data.email || data.officialEmail || 'N/A',
            'PHONE': data.phone || data.mobileNo || data.mobile || data.whatsapp || data.mobileNumber || 'N/A',
            'MOBILE': data.mobile || data.phone || data.whatsapp || data.mobileNumber || 'N/A',
            'MOBILE_NUMBER': data.mobileNumber || data.mobile || data.phone || 'N/A',
            'EXHIBITOR_NAME': data.exhibitor_name || data.exhibitorName || data.name || 'N/A',
            'STALL_NO': data.stall_no || data.stallNo || data.stallFor || 'N/A',
            'LOGIN_URL': data.login_url || 'https://ihwe.in/exhibitor-login',
            'USERNAME': data.username || data.email || data.officialEmail || 'N/A',
            'PASSWORD': data.password || 'N/A',
            'EVENT_NAME': data.event_name || data.eventName || 'IHWE 2026',
            'CONTACT_PERSON': data.contact_person || (data.contact1FirstName ? `${data.contact1FirstName} ${data.contact1LastName || ''}`.trim() : 'N/A'),
            'DESIGNATION': data.designation || 'N/A',
            'REGISTRATION_ID': data.registrationId || data.regId || 'N/A',
            'STALL_TYPE': data.stall_type || 'N/A',
            'STALL_SCHEME': data.stall_scheme || data.stallScheme || 'N/A',
            'STALL_DIMENSION': data.stall_dimension || data.dimension || 'N/A',
            'STALL_SIZE': data.stall_size || data.stallSize || 'N/A',
            'TOTAL_AMOUNT': data.total_amount || 'N/A',
            'AMOUNT_PAID': data.amount_paid || 'N/A',
            'BALANCE_DUE': data.balance_due || 'N/A',
            'PAYMENT_MODE': data.payment_mode || 'N/A',
            'PAYMENT_METHOD': data.payment_method || data.method || 'N/A',
            'TRANSACTION_ID': data.transaction_id || 'N/A',
            'ORDER_NO': data.order_no || 'N/A',
            'GRAND_TOTAL': data.grand_total || 'N/A',
            'ITEM_TABLE': data.item_table || 'N/A',
            'PAYMENT_STATUS': data.payment_status || 'N/A',
        };

        const upperKey = key.toUpperCase();
        if (aliases[upperKey] !== undefined) return aliases[upperKey];
        const cleanUpperKey = upperKey.replace(/_/g, '');
        for (const [dKey, dValue] of Object.entries(data)) {
            const cleanDKey = dKey.toUpperCase().replace(/_/g, '');
            if (cleanDKey === cleanUpperKey) return dValue;
        }
        return null;
    }

function applyPlaceholders(text, data) {
        if (!text) return '';
        return text.replace(/\[\[\s*([a-zA-Z0-9_]+)\s*\]\]/g, (match, key) => {
            const value = this.resolvePlaceholderValue(key, data);
            return value === null ? match : value;
        });
    }

    // Returns the ordered list of resolved values for every distinct [[PLACEHOLDER]] in
    // `text` (in order of first appearance) - reuses the exact same resolution as
    // applyPlaceholders so AiSensy's positional templateParams always match what the
    // legacy free-text WhatsApp message would have shown.

function extractPlaceholderParams(text, data) {
        if (!text) return [];
        const seen = new Set();
        const params = [];
        text.replace(/\[\[\s*([a-zA-Z0-9_]+)\s*\]\]/g, (match, key) => {
            const upperKey = key.toUpperCase();
            if (!seen.has(upperKey)) {
                seen.add(upperKey);
                const value = this.resolvePlaceholderValue(key, data);
                params.push(value === null ? '' : String(value));
            }
            return match;
        });
        return params;
    }

    // Tries the dedicated AiSensy template for this formType (if its campaign env var
    // is configured). Returns { skipped: true } if not configured yet, so the caller
    // falls back to the legacy whatsapp.sendWhatsAppMessage path unchanged.

async function trySendAisensyForFormType(formType, mobile, template, data) {
        const campaignEnvKey = AISENSY_CAMPAIGN_BY_FORM_TYPE[formType];
        if (!campaignEnvKey) return { skipped: true };

        const bannerEnvKey = AISENSY_BANNER_BY_FORM_TYPE[formType];
        const bannerUrl = bannerEnvKey ? (process.env[bannerEnvKey] || '').trim() : '';

        return await aisensy.sendTemplate({
            campaignEnvKey,
            phone: mobile,
            templateParams: this.extractPlaceholderParams(template.whatsappBody, data),
            media: bannerUrl ? { url: bannerUrl, filename: `${formType}.jpg` } : null
        });
    }

async function sendDynamicConfirmation({ to, formType, data, profile = 'DEFAULT', attachments = [], padding, notifyAdmin: shouldNotifyAdmin = true }) {
        try {
            const template = await this.getTemplate(formType);
            if (!template) {
                console.warn('No dynamic template found for ' + formType + '. Falling back to logic-based default.');
                return false;
            }
            if (formType.startsWith('exhibitor-') && formType !== 'exhibitor-registration') {
                if (!template.headerImage || !template.footerImage) {
                    const mainExTemplate = await this.getTemplate('exhibitor-registration');
                    if (mainExTemplate) {
                        if (!template.headerImage) template.headerImage = mainExTemplate.headerImage;
                        if (!template.footerImage) template.footerImage = mainExTemplate.footerImage;
                    }
                }
            }

            const subject = this.applyPlaceholders(template.emailSubject, data);

            // Protect [[QR_CODE]] from being wiped by applyPlaceholders
            const QR_TOKEN = '__QR_CODE_PLACEHOLDER__';
            let rawBody = template.emailBody.replace(/\[\[QR_CODE\]\]/g, QR_TOKEN);
            let bodyContent = this.applyPlaceholders(rawBody, data);

            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) { console.error('[getImageBuffer] Not found:', absPath); return null; }
                    return fs.readFileSync(absPath);
                } catch (e) { console.error('[getImageBuffer] error:', e.message); return null; }
            };

            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);
            const smallLogoBuf = getImageBuffer(template.smallLogo);

            // Insert small logo at the very bottom of the email (after Warm Regards)
            if (template.smallLogo && smallLogoBuf) {
                const smallLogoHtml = `<div style="text-align: left; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><img src="cid:email_small_logo_img@ihwe.in" alt="Logo" width="150" style="display:block; max-width:150px; height:auto; border:0;" /></div>`;
                bodyContent += smallLogoHtml;
            }

            if ((formType === 'corporate-visitor' || formType === 'general-visitor' || formType === 'buyer-registration' || formType === 'health-camp-visitor') && data.registrationId) {
                try {
                    const frontendUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                    const scanPath = formType === 'buyer-registration' ? 'buyer-scan' : 'visitor';
                    const scanUrl = `${frontendUrl}/${scanPath}?id=${encodeURIComponent(data.registrationId)}`;
                    const qrBuffer = await QRCode.toBuffer(scanUrl, {
                        width: 150,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });
                    const qrBlock = `
                        <div style="text-align: center; margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                            <p style="font-weight:700;color:#23471d;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Scan QR Code for Entry</p>
                            <img src="cid:qrcode_entry@ihwe.in" alt="Entry QR Code" width="120" height="120" style="border:4px solid #23471d;border-radius:8px;display:inline-block;" />
                            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Registration ID: <strong>${data.registrationId}</strong></p>
                            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Present this QR code at the entrance for hassle-free access.</p>
                        </div>`;
                    if (bodyContent.includes(QR_TOKEN)) {
                        bodyContent = bodyContent.replace(QR_TOKEN, qrBlock);
                    } else {
                        bodyContent += qrBlock;
                    }

                    data.__qrBuffer = qrBuffer;
                } catch (qrErr) {
                    console.error('[QR] Failed to generate QR code:', qrErr.message);
                    bodyContent = bodyContent.replace(QR_TOKEN, '');
                }
            } else {
                bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
            }



            const html = this.emailShell(bodyContent, {
                headerCid: headerBuf ? 'email_header_img@ihwe.in' : null,
                footerCid: footerBuf ? 'email_footer_img@ihwe.in' : null,
                smallLogoCid: smallLogoBuf ? 'email_small_logo_img@ihwe.in' : null,
                headerImage: template.headerImage || null,
                footerImage: template.footerImage || null,
                smallLogoImage: template.smallLogo || null,
                padding: padding || (formType === 'exhibitor-payment-receipt' ? '8px 20px 10px 20px' : null),
                hideFallbackFooter: formType === 'exhibitor-payment-receipt'
            });

            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);


            const emailAttachments = [];
            if (data.__qrBuffer) {
                emailAttachments.push({
                    filename: 'entry-qr.png',
                    content: data.__qrBuffer,
                    cid: 'qrcode_entry@ihwe.in'
                });
            }
            if (headerBuf) {
                const hExt = (template.headerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `header.${hExt}`, content: headerBuf, cid: 'email_header_img@ihwe.in' });
            }
            if (footerBuf) {
                const fExt = (template.footerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `footer.${fExt}`, content: footerBuf, cid: 'email_footer_img@ihwe.in' });
            }
            if (smallLogoBuf) {
                const sExt = (template.smallLogo || '').split('.').pop().toLowerCase() || 'webp';
                emailAttachments.push({ filename: `smallLogo.${sExt}`, content: smallLogoBuf, cid: 'email_small_logo_img@ihwe.in' });
            }

            const mobile = data.whatsapp || data.mobile || data.phone || data.mobileNumber;
            const sendDynamicWhatsapp = async () => {
                if (!mobile || !whatsappContent) {
                    return { success: false, skipped: true, reason: 'Mobile number or WhatsApp content missing' };
                }

                const result = await this.trySendAisensyForFormType(formType, mobile, template, data);
                if (!result.success) {
                    return whatsapp.sendWhatsAppMessage(mobile, whatsappContent, `Dynamic: ${formType}`);
                }
                return result;
            };
            const accessoryWhatsappPromise = formType === 'exhibitor-accessory-order'
                ? sendDynamicWhatsapp().catch(err => ({ success: false, error: err.message }))
                : null;

            const emailPayload = {
                to,
                subject,
                html,
                attachments: [...emailAttachments, ...attachments],
                profile,
                logData: {
                    name: data.contact_person || data.firstName || data.name,
                    phone: data.mobile || data.phone,
                    message: `Dynamic Confirmation (${formType})`
                }
            };

            let sentToUser = false;
            let accessoryWhatsappResult = null;

            if (formType === 'exhibitor-accessory-order') {
                console.log('[AccessoryNotification] Dynamic send attempt:', {
                    orderNo: data.order_no,
                    email: to || null,
                    mobile: mobile || null,
                    attachmentCount: emailPayload.attachments.length
                });

                const [emailResult, whatsappResult] = await Promise.all([
                    to
                        ? this.sendEmail(emailPayload)
                        : Promise.resolve(false),
                    accessoryWhatsappPromise
                ]);
                sentToUser = !!emailResult;
                accessoryWhatsappResult = whatsappResult;
                if (!to) {
                    console.warn('[Email] Accessory order email skipped: recipient email missing');
                }
                console.log('[AccessoryNotification] Dynamic result:', {
                    orderNo: data.order_no,
                    emailSent: !!emailResult,
                    whatsappSent: !!whatsappResult?.success,
                    whatsappSkipped: !!whatsappResult?.skipped,
                    whatsappError: whatsappResult?.error || whatsappResult?.reason || null
                });
            } else {
                sentToUser = await this.sendEmail(emailPayload);
            }


            if (formType === 'exhibitor-accessory-order') {
                const whatsappResult = accessoryWhatsappResult;
                if (!whatsappResult?.success) {
                    console.error(`[WhatsApp] Accessory order msg failed for ${mobile || 'missing mobile'}:`, whatsappResult?.error || whatsappResult?.reason || 'Unknown error');
                }
                sentToUser = sentToUser || !!whatsappResult?.success;
            } else if (mobile && whatsappContent) {
                sendDynamicWhatsapp().catch(err => {
                    console.error(`[WhatsApp] Failed to send dynamic msg for ${formType}:`, err.message);
                });
            }
            if (shouldNotifyAdmin && formType !== 'exhibitor-registration') {
                await this.notifyAdmin(formType, data, subject, profile).catch(err => {
                    console.error(`[AdminNotification] Failed for ${formType}:`, err.message);
                });
            }

            return sentToUser;
        } catch (error) {
            console.error('Error sending dynamic confirmation for ' + formType + ':', error);
            return false;
        }
    }

async function notifyAdmin(formType, data, originalSubject, profile) {
        // Website (public) registrations never send created_by; admin-panel-entered
        // registrations always do (see generalVisitorSlice.js etc.) — use that to
        // tag the admin alert subject with where the registration came from.
        const registrationSource = data.created_by ? 'Portal' : 'Web';
        const dedicatedAlerts = {
            'general-visitor': {
                html: () => getGeneralVisitorAdminAlertTemplate(data),
                subject: `${registrationSource} | NEW GENERAL VISITOR REGISTRATION ALERT | IHWE 2026 | Reg ID: ${data.registrationId || 'N/A'}`
            },
            'corporate-visitor': {
                html: () => getCorporateVisitorAdminAlertTemplate(data),
                subject: `${registrationSource} | NEW CORPORATE VISITOR REGISTRATION ALERT | IHWE 2026 | Reg ID: ${data.registrationId || 'N/A'}`
            },
            'contact-enquiry': {
                html: () => getGeneralEnquiryAdminAlertTemplate(data),
                subject: `NEW GENERAL ENQUIRY RECEIVED | IHWE 2026 | ${data.name || 'Website Enquiry'}`
            }
        };
        const alert = dedicatedAlerts[formType];
        if (!alert) {
            console.warn(`[AdminNotification] Skipped unsupported generic admin alert for "${formType}". Use a dedicated admin template.`);
            return false;
        }

        const targetAdmin = ((this.getAdminEmailForProfile(profile) || process.env.ADMIN_EMAIL) || '').trim();
        if (!targetAdmin) {
            console.warn(`[AdminNotification] No receiver found for ${formType} lead.`);
            return false;
        }

        const adminHtml = alert.html();
        const adminSubject = alert.subject;
        console.log(`[AdminNotification] Routing ${formType} lead to designated admin: ${targetAdmin}`);

        await this.sendEmail({
            to: targetAdmin,
            subject: adminSubject,
            html: adminHtml,
            profile,
            logData: {
                name: data.name || data.fullName,
                phone: data.phone || data.mobile || data.mobileNumber,
                message: `Admin Lead Alert (${formType})`
            }
        });

        const adminWhatsApp = (process.env.ADMIN_WHATSAPP_NUMBER || '').trim();
        if (adminWhatsApp) {
            const adminMsg = `🚨 *NEW ${formType.toUpperCase()} LEAD* 🚨\n\n*Name:* ${data.name || data.fullName}\n*Company:* ${data.company || data.companyName}\n*Email:* ${data.email}\n*Phone:* ${data.phone}\n*Subject:* ${originalSubject}\n\n_Please check your admin panel for full details._`;
            whatsapp.sendWhatsAppMessage(adminWhatsApp, adminMsg, `Admin Lead Alert: ${formType}`).catch(err => {
                console.error(`[AdminWhatsAppAlert] Failed for ${formType}:`, err.message);
            });
        }
        return true;
    }

function getAdminEmailForProfile(profile) {
        switch (profile) {
            case 'VISITOR': return process.env.VISITOR_ADMIN_EMAIL;
            case 'SPEAKER': return process.env.SPEAKER_ADMIN_EMAIL;
            case 'EXHIBITOR': return process.env.EXHIBITOR_ADMIN_EMAIL;
            case 'CONTACT': return process.env.CONTACT_ADMIN_EMAIL;
            default: return process.env.ADMIN_EMAIL;
        }
    }

function getExhibitorRecipient(registration) {
        return String(
            registration?.officialEmail
            || registration?.companyEmail
            || registration?.contact1?.email
            || ''
        ).trim();
    }

module.exports = { getTemplate, getExhibitorTemplateData, resolvePlaceholderValue, applyPlaceholders, extractPlaceholderParams, trySendAisensyForFormType, sendDynamicConfirmation, notifyAdmin, getAdminEmailForProfile, getExhibitorRecipient };
