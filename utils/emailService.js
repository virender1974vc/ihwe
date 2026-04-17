const nodemailer = require('nodemailer');
const fs = require('fs');
const QRCode = require('qrcode');
const EmailLog = require('../models/EmailLog');
const whatsapp = require('./whatsapp');
const { getResponsiveVisitorAlertTemplate } = require('./emailTemplates/responsiveVisitorAlert');
const { getBuyerInterestAlertTemplate } = require('./emailTemplates/buyerInterestAlert');
const { getSimpleVisitorAlertTemplate } = require('./emailTemplates/simpleVisitorAlert');
const { getExhibitorAdminAlertTemplate } = require('./emailTemplates/exhibitorAdminAlert');
const { getBuyerRegistrationAlertTemplate } = require('./emailTemplates/buyerRegistrationAlert');

class EmailService {
    constructor() {
        // Main SMTP Transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Dedicated Contact Form SMTP Transporter
        const contactHost = process.env.CONTACT_SMTP_HOST || process.env.SMTP_HOST;
        const contactPort = process.env.CONTACT_SMTP_PORT || process.env.SMTP_PORT;
        const contactUser = process.env.CONTACT_SMTP_USER || process.env.SMTP_USER;
        const contactPass = process.env.CONTACT_SMTP_PASS || process.env.SMTP_PASS;

        this.contactTransporter = nodemailer.createTransport({
            host: contactHost, port: contactPort, secure: false,
            auth: { user: contactUser, pass: contactPass }
        });

        // Dedicated Speaker Portal SMTP Transporter
        const speakerHost = process.env.SPEAKER_SMTP_HOST || process.env.SMTP_HOST;
        const speakerPort = process.env.SPEAKER_SMTP_PORT || process.env.SMTP_PORT;
        const speakerUser = process.env.SPEAKER_SMTP_USER || process.env.SMTP_USER;
        const speakerPass = process.env.SPEAKER_SMTP_PASS || process.env.SMTP_PASS;

        this.speakerTransporter = nodemailer.createTransport({
            host: speakerHost, port: speakerPort, secure: false,
            auth: { user: speakerUser, pass: speakerPass }
        });

        // Dedicated Visitor Portal SMTP Transporter
        const visitorHost = process.env.VISITOR_SMTP_HOST || process.env.SMTP_HOST;
        const visitorPort = process.env.VISITOR_SMTP_PORT || process.env.SMTP_PORT;
        const visitorUser = process.env.VISITOR_SMTP_USER || process.env.SMTP_USER;
        const visitorPass = process.env.VISITOR_SMTP_PASS || process.env.SMTP_PASS;

        this.visitorTransporter = nodemailer.createTransport({
            host: visitorHost, port: visitorPort, secure: false,
            auth: { user: visitorUser, pass: visitorPass }
        });

        // Dedicated Exhibitor Portal SMTP Transporter
        const exhibitorHost = process.env.EXHIBITOR_SMTP_HOST || process.env.SMTP_HOST;
        const exhibitorPort = process.env.EXHIBITOR_SMTP_PORT || process.env.SMTP_PORT;
        const exhibitorUser = process.env.EXHIBITOR_SMTP_USER || process.env.SMTP_USER;
        const exhibitorPass = process.env.EXHIBITOR_SMTP_PASS || process.env.SMTP_PASS;

        this.exhibitorTransporter = nodemailer.createTransport({
            host: exhibitorHost, port: exhibitorPort, secure: false,
            auth: { user: exhibitorUser, pass: exhibitorPass }
        });

        this.emailShell = (body, options = {}) => {
            const { headerCid, footerCid, headerImage, footerImage } = options;

            // Use CID if available, else try base64 embed, else fallback to default
            const toBase64 = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) { console.error('[emailShell] Image not found:', absPath); return null; }
                    const ext = imgPath.split('.').pop().toLowerCase();
                    const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
                    const mime = mimeMap[ext] || 'jpeg';
                    const data = fs.readFileSync(absPath).toString('base64');
                    return `data:image/${mime};base64,${data}`;
                } catch (e) {
                    console.error('[emailShell] toBase64 error:', e.message);
                    return null;
                }
            };

            const headerSrc = headerCid ? `cid:${headerCid}` : toBase64(headerImage);
            const footerSrc = footerCid ? `cid:${footerCid}` : toBase64(footerImage);

            const headerSection = headerSrc
                ? `<div style="line-height:0;"><img src="${headerSrc}" alt="Header" style="width:100%;display:block;" /></div>`
                : `<div class="header"><h1 style="margin:0; font-size: 22px;">9th International Health & Wellness Expo</h1><p style="margin:5px 0 0; opacity: 0.8; font-size: 14px;">Global Health Connect | IHWE 2026</p></div>`;

            const footerSection = footerSrc
                ? `<div style="line-height:0;"><img src="${footerSrc}" alt="Footer" style="width:100%;display:block;" /></div>`
                : `<div class="footer"><p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p><p>Namo Gange Trust Foundation</p></div>`;

            return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 800px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 30px; text-align: center; color: white; }
                .header-img { line-height: 0; }
                .content { padding: 40px; background: #ffffff; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                .footer-img { line-height: 0; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #23471d; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; transition: background 0.3s ease; }
                .qr-section { text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; }
                .qr-section img { display: inline-block; }
            </style>
        </head>
        <body>
            <div class="container">
                ${headerSection}
                <div class="content">
                    ${body}
                </div>
                ${footerSection}
            </div>
        </body>
        </html>
        `;
        };

        this.adminLeadShell = (formType, data) => {
            const fullName = data.name || data.firstName || data.fullName || 'New Lead';
            const email = data.email || data.officialEmail || 'N/A';
            const phone = data.phone || data.mobileNo || data.mobile || 'N/A';
            const subject = data.service || data.proposedTopic || data.topic || 'Inquiry';

            let rows = '';
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value !== 'object' && value !== null && value !== undefined && key !== 'password') {
                    rows += `
                        <tr style="border-bottom: 1px solid #374151;">
                            <td style="padding: 12px 0; color: #9ca3af; font-size: 14px; width: 40%;">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</td>
                            <td style="padding: 12px 0; color: #ffffff; font-size: 15px; font-weight: 500;">${value}</td>
                        </tr>
                    `;
                }
            });

            return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
                    .wrapper { max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
                    .header { background-color: #065f46; padding: 30px; text-align: center; border-bottom: 4px solid #047857; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800; text-transform: uppercase; }
                    .body { padding: 40px; color: #ffffff; }
                    .badge { display: inline-block; background-color: rgba(6, 95, 70, 0.2); color: #34d399; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.2); text-transform: uppercase; }
                    .lead-title { font-size: 20px; font-weight: 700; margin-bottom: 30px; color: #f9fafb; border-bottom: 1px solid #374151; padding-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    .footer { background-color: #000000; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="header">
                        <h1>NEW ${formType.replace('-', ' ').toUpperCase()}</h1>
                    </div>
                    <div class="body">
                        <center><div class="badge">URGENT RESPONSE REQUIRED</div></center>
                        <h2 class="lead-title" style="text-align: center;">Lead Details from ${fullName}</h2>
                        <table>
                            ${rows}
                        </table>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 IHWE | Admin Lead Notification Service</p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }
    }

    async getTemplate(formType) {
        try {
            const MessageTemplate = require('../models/MessageTemplate');
            return await MessageTemplate.findOne({ formType });
        } catch (error) {
            console.error('Error fetching template for ' + formType + ':', error);
            return null;
        }
    }

    applyPlaceholders(text, data) {
        if (!text) return '';
        let result = text;

        // Create an alias map for common placeholders
        const aliases = {
            'NAME': data.fullName || data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : ''),
            'REG_ID': data.registrationId || data.regId || data.REG_ID || 'N/A',
            'SERVICE': data.service || data.proposedTopic || data.topic || 'IHWE Services',
            'COMPANY': data.companyName || data.company || data.organization || data.organizationName || 'N/A',
            'CATEGORY': data.category || data.registrationCategory || 'N/A',
            'EMAIL': data.email || data.officialEmail || 'N/A',
            'PHONE': data.phone || data.mobileNo || data.mobile || data.whatsapp || 'N/A',
            'EXHIBITOR_NAME': data.exhibitor_name || data.exhibitorName || data.name || 'N/A',
            'STALL_NO': data.stall_no || data.stallNo || data.stallFor || 'N/A',
            'LOGIN_URL': data.login_url || 'https://ihwe.in/exhibitor-login',
            'USERNAME': data.username || data.email || data.officialEmail || 'N/A',
            'PASSWORD': data.password || 'N/A',
            'EVENT_NAME': data.event_name || data.eventName || 'IHWE 2026',
        };

        // Apply Aliases first
        Object.entries(aliases).forEach(([key, value]) => {
            const placeholder = '[[' + key + ']]';
            result = result.split(placeholder).join(value || '');
        });

        // Apply any specific data keys left over (case-insensitive)
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value !== 'object') {
                const placeholder = '[[' + key.toUpperCase() + ']]';
                result = result.split(placeholder).join(value || '');
            }
        });

        return result;
    }

    async sendDynamicConfirmation({ to, formType, data, profile = 'DEFAULT' }) {
        try {
            const template = await this.getTemplate(formType);
            if (!template) {
                console.warn('No dynamic template found for ' + formType + '. Falling back to logic-based default.');
                return false;
            }

            const subject = this.applyPlaceholders(template.emailSubject, data);

            // Protect [[QR_CODE]] from being wiped by applyPlaceholders
            const QR_TOKEN = '__QR_CODE_PLACEHOLDER__';
            let rawBody = template.emailBody.replace(/\[\[QR_CODE\]\]/g, QR_TOKEN);
            let bodyContent = this.applyPlaceholders(rawBody, data);

            // For corporate/general visitor + buyer: generate QR code as CID attachment
            if ((formType === 'corporate-visitor' || formType === 'general-visitor' || formType === 'buyer-registration') && data.registrationId) {
                try {
                    const frontendUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                    const scanPath = formType === 'buyer-registration' ? 'buyer-scan' : 'visitor';
                    const scanUrl = `${frontendUrl}/${scanPath}?id=${encodeURIComponent(data.registrationId)}`;
                    const qrBuffer = await QRCode.toBuffer(scanUrl, {
                        width: 280,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });
                    const qrBlock = `
                        <div class="qr-section">
                            <p style="font-weight:700;color:#23471d;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Scan QR Code for Entry</p>
                            <img src="cid:qrcode_entry" alt="Entry QR Code" width="240" height="240" style="border:4px solid #23471d;border-radius:8px;display:inline-block;" />
                            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Registration ID: <strong>${data.registrationId}</strong></p>
                            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Present this QR code at the entrance for hassle-free access.</p>
                        </div>
                    `;
                    if (bodyContent.includes(QR_TOKEN)) {
                        bodyContent = bodyContent.replace(QR_TOKEN, qrBlock);
                    } else {
                        bodyContent += qrBlock;
                    }
                    // Store QR buffer as attachment for CID embedding
                    data.__qrBuffer = qrBuffer;
                } catch (qrErr) {
                    console.error('[QR] Failed to generate QR code:', qrErr.message);
                    bodyContent = bodyContent.replace(QR_TOKEN, '');
                }
            } else {
                bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
            }

            // Build CID attachments for header/footer images
            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) { console.error('[getImageBuffer] Not found:', absPath); return null; }
                    return fs.readFileSync(absPath);
                } catch (e) { console.error('[getImageBuffer] error:', e.message); return null; }
            };

            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);

            const html = this.emailShell(bodyContent, {
                headerCid: headerBuf ? 'email_header_img' : null,
                footerCid: footerBuf ? 'email_footer_img' : null,
                headerImage: template.headerImage || null,
                footerImage: template.footerImage || null,
            });

            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);

            // 1. Send Email to USER
            const emailAttachments = [];
            if (data.__qrBuffer) {
                emailAttachments.push({
                    filename: 'entry-qr.png',
                    content: data.__qrBuffer,
                    cid: 'qrcode_entry'
                });
            }
            if (headerBuf) {
                const hExt = (template.headerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `header.${hExt}`, content: headerBuf, cid: 'email_header_img' });
            }
            if (footerBuf) {
                const fExt = (template.footerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `footer.${fExt}`, content: footerBuf, cid: 'email_footer_img' });
            }
            const sentToUser = await this.sendEmail({
                to,
                subject,
                html,
                attachments: emailAttachments,
                profile,
                logData: { name: data.firstName || data.name, phone: data.mobile || data.phone, message: `Dynamic Confirmation (${formType})` }
            });

            // 2. Send WhatsApp to USER (if available)
            const mobile = data.mobile || data.phone || data.whatsapp;
            if (mobile && whatsappContent) {
                whatsapp.sendWhatsAppMessage(mobile, whatsappContent, `Dynamic: ${formType}`).catch(err => {
                    console.error(`[WhatsApp] Failed to send dynamic msg for ${formType}:`, err.message);
                });
            }
            if (formType !== 'exhibitor-registration') {
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

    async notifyAdmin(formType, data, originalSubject, profile) {
        // Find the designated admin for this PARTICULAR form
        const deptAdmin = (this.getAdminEmailForProfile(profile) || '').trim();
        const globalAdmin = (process.env.ADMIN_EMAIL || '').trim();

        // If a department-specific admin exists, they get the lead. 
        // Otherwise, it falls back to the global admin.
        const targetAdmin = deptAdmin || globalAdmin;

        if (!targetAdmin) {
            console.warn(`[AdminNotification] No receiver found for ${formType} Lead.`);
            return;
        }

        console.log(`[AdminNotification] Routing ${formType} lead specifically to designated admin: ${targetAdmin}`);

        const adminHtml = this.adminLeadShell(formType, data);

        // For Admin Notifications, we ALWAYS use the DEFAULT transporter to ensure delivery
        return await this.sendEmail({
            to: targetAdmin,
            subject: `NEW LEAD ALERT: ${originalSubject}`,
            html: adminHtml,
            profile: 'DEFAULT',
            logData: { name: "System Admin Notification", message: `Lead alert for ${formType}` }
        });
    }

    getAdminEmailForProfile(profile) {
        switch (profile) {
            case 'VISITOR': return process.env.VISITOR_ADMIN_EMAIL;
            case 'SPEAKER': return process.env.SPEAKER_ADMIN_EMAIL;
            case 'EXHIBITOR': return process.env.EXHIBITOR_ADMIN_EMAIL;
            case 'CONTACT': return process.env.CONTACT_ADMIN_EMAIL;
            default: return process.env.ADMIN_EMAIL;
        }
    }

    async sendEmail({ to, subject, html, attachments = [], profile = 'DEFAULT', logData = {} }) {
        try {
            let transporter = this.transporter;
            let fromEmail = process.env.FROM_EMAIL;
            let fromName = process.env.FROM_NAME;

            if (profile === 'CONTACT') {
                transporter = this.contactTransporter;
                fromEmail = process.env.CONTACT_FROM_EMAIL || fromEmail;
                fromName = process.env.CONTACT_FROM_NAME || fromName;
            } else if (profile === 'SPEAKER') {
                transporter = this.speakerTransporter;
                fromEmail = process.env.SPEAKER_FROM_EMAIL || fromEmail;
                fromName = process.env.SPEAKER_FROM_NAME || fromName;
            } else if (profile === 'VISITOR') {
                transporter = this.visitorTransporter;
                fromEmail = process.env.VISITOR_FROM_EMAIL || fromEmail;
                fromName = process.env.VISITOR_FROM_NAME || fromName;
            } else if (profile === 'EXHIBITOR') {
                transporter = this.exhibitorTransporter;
                fromEmail = process.env.EXHIBITOR_FROM_EMAIL || fromEmail;
                fromName = process.env.EXHIBITOR_FROM_NAME || fromName;
            }

            const info = await transporter.sendMail({
                from: '"' + fromName + '" <' + fromEmail + '>',
                to,
                subject,
                html,
                attachments
            });

            // Log the email in the database - ALIGNED WITH EmailLog Model
            await EmailLog.create({
                recipient: to,
                subject,
                status: 'success',
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null
            }).catch(err => console.error("EmailLog (success) failed:", err.message));

            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            await EmailLog.create({
                recipient: to,
                subject,
                status: 'failed',
                error: error.message,
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null
            }).catch(err => console.error("EmailLog (failed) failed:", err.message));
            return false;
        }
    }

    async sendVisitorRegistrationEmails(data) {
        const type = data.visitorType.toLowerCase().includes('corporate') ? 'corporate-visitor' :
            data.visitorType.toLowerCase().includes('health') ? 'health-camp-visitor' : 'general-visitor';

        return await this.sendDynamicConfirmation({
            to: data.email,
            formType: type,
            data: {
                ...data,
                name: `${data.firstName} ${data.lastName || ''}`.trim(),
            },
            profile: 'VISITOR'
        });
    }

    async sendVisitorConfirmationOnly(data, formType) {
        try {
            const template = await this.getTemplate(formType);
            if (!template) {
                console.warn('No dynamic template found for ' + formType);
                return false;
            }

            const subject = this.applyPlaceholders(template.emailSubject, data);
            const QR_TOKEN = '__QR_CODE_PLACEHOLDER__';
            let rawBody = template.emailBody.replace(/\[\[QR_CODE\]\]/g, QR_TOKEN);
            let bodyContent = this.applyPlaceholders(rawBody, data);
            const emailAttachments = [];
            if ((formType === 'corporate-visitor' || formType === 'general-visitor' || formType === 'buyer-registration') && data.registrationId) {
                try {
                    const frontendUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                    const scanPath = formType === 'buyer-registration' ? 'buyer-scan' : 'visitor';
                    const scanUrl = `${frontendUrl}/${scanPath}?id=${encodeURIComponent(data.registrationId)}`;
                    const qrBuffer = await QRCode.toBuffer(scanUrl, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                    const qrBlock = `
                        <div class="qr-section">
                            <p style="font-weight:700;color:#23471d;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Scan QR Code for Entry</p>
                            <img src="cid:qrcode_entry" alt="Entry QR Code" width="240" height="240" style="border:4px solid #23471d;border-radius:8px;display:inline-block;" />
                            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Registration ID: <strong>${data.registrationId}</strong></p>
                            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Present this QR code at the entrance for hassle-free access.</p>
                        </div>`;
                    bodyContent = bodyContent.includes(QR_TOKEN) ? bodyContent.replace(QR_TOKEN, qrBlock) : bodyContent + qrBlock;
                    emailAttachments.push({ filename: 'entry-qr.png', content: qrBuffer, cid: 'qrcode_entry' });
                } catch (qrErr) {
                    console.error('[QR] Failed to generate QR code:', qrErr.message);
                    bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
                }
            } else {
                bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
            }
            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) return null;
                    return fs.readFileSync(absPath);
                } catch (e) { return null; }
            };
            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);
            if (headerBuf) {
                const hExt = (template.headerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `header.${hExt}`, content: headerBuf, cid: 'email_header_img' });
            }
            if (footerBuf) {
                const fExt = (template.footerImage || '').split('.').pop().toLowerCase() || 'png';
                emailAttachments.push({ filename: `footer.${fExt}`, content: footerBuf, cid: 'email_footer_img' });
            }

            const html = this.emailShell(bodyContent, {
                headerCid: headerBuf ? 'email_header_img' : null,
                footerCid: footerBuf ? 'email_footer_img' : null,
                headerImage: template.headerImage || null,
                footerImage: template.footerImage || null,
            });

            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);

            // 1. Send Email to USER only (no admin notification)
            const sentToUser = await this.sendEmail({
                to: data.emailAddress || data.email,
                subject,
                html,
                attachments: emailAttachments,
                profile: 'VISITOR',
                logData: { name: data.fullName || data.firstName || data.name, phone: data.mobileNumber || data.mobile || data.phone, message: `Visitor Confirmation (${formType})` }
            });

            // 2. Send WhatsApp to USER (if available)
            const mobile = data.mobile || data.phone || data.whatsapp;
            if (mobile && whatsappContent) {
                whatsapp.sendWhatsAppMessage(mobile, whatsappContent, `Visitor: ${formType}`).catch(err => {
                    console.error(`[WhatsApp] Failed to send msg for ${formType}:`, err.message);
                });
            }

            return sentToUser;
        } catch (error) {
            console.error('Error sending visitor confirmation for ' + formType + ':', error);
            return false;
        }
    }

    async sendB2BMeetingNotification(data) {
        try {
            const registrationDate = new Date().toLocaleDateString('en-GB');
            const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const interestedSegments = data.areaOfInterest?.join(', ') || 'N/A';
            const purposeOfVisit = data.purposeOfVisit?.join(', ') || 'N/A';

            const subject = `New Visitor Registration Alert | IHWE 2026 | Reg ID: ${data.registrationId}`;

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                    .header { background-color: #065f46; padding: 25px; text-align: center; color: #ffffff; }
                    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
                    .content { padding: 30px; color: #333333; line-height: 1.6; }
                    .content p { margin: 10px 0; }
                    .divider { border-top: 2px solid #e5e7eb; margin: 20px 0; }
                    .details-section { background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .details-section h3 { color: #065f46; margin-top: 0; font-size: 16px; }
                    .details-row { display: flex; margin: 8px 0; }
                    .details-label { font-weight: 600; color: #4b5563; min-width: 200px; }
                    .details-value { color: #1f2937; }
                    .action-section { background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .action-section h3 { color: #92400e; margin-top: 0; font-size: 16px; }
                    .action-section ul { margin: 10px 0; padding-left: 20px; }
                    .action-section li { margin: 5px 0; color: #78350f; }
                    .footer { background-color: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
                    .footer p { margin: 5px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Visitor Registration Alert | IHWE 2026</h1>
                        <p style="margin: 5px 0 0; font-size: 14px;">Reg ID: ${data.registrationId}</p>
                    </div>
                    <div class="content">
                        <p><strong>Dear Team,</strong></p>
                        <p>This is to inform you that a new Visitor Registration has been successfully received for the <strong>9th International Health & Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
                        <p>Please find the registration details below for your reference and necessary follow-up:</p>
                        
                        <div class="divider"></div>
                        
                        <div class="details-section">
                            <h3>🔹 Visitor Details</h3>
                            <div class="details-row">
                                <span class="details-label">Registration ID:</span>
                                <span class="details-value">${data.registrationId}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Registration Date:</span>
                                <span class="details-value">${registrationDate}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Registration Time:</span>
                                <span class="details-value">${registrationTime}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Name:</span>
                                <span class="details-value">${data.firstName} ${data.lastName}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Category:</span>
                                <span class="details-value">${data.visitorType}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Company Name:</span>
                                <span class="details-value">${data.companyName}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Designation:</span>
                                <span class="details-value">${data.designation}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Email ID:</span>
                                <span class="details-value">${data.email}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Mobile Number:</span>
                                <span class="details-value">${data.mobile}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">City:</span>
                                <span class="details-value">${data.city}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Interested Segments:</span>
                                <span class="details-value">${interestedSegments}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Purpose of Visit:</span>
                                <span class="details-value">${purposeOfVisit}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">B2B Meeting Request:</span>
                                <span class="details-value"><strong>${data.b2bMeeting ? data.b2bMeeting.charAt(0).toUpperCase() + data.b2bMeeting.slice(1) : 'No'}</strong></span>
                            </div>
                        </div>
                        
                        <div class="action-section">
                            <h3>📌 Action Required</h3>
                            <ul>
                                <li>Verify the registration details</li>
                                <li>Ensure confirmation email & QR code has been sent</li>
                                <li>Update the central registration database</li>
                                <li>Assign follow-up (if Corporate Visitor / Buyer)</li>
                            </ul>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p>Please ensure timely action and coordination to maintain seamless visitor management.</p>
                        <p><strong>Best Regards,</strong><br>
                        Team IHWE 2026<br>
                        Namo Gange Wellness Pvt. Ltd.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p>
                        <p>Namo Gange Wellness Pvt. Ltd.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            // Send to B2B coordinator
            const b2bCoordinatorEmail = process.env.B2B_COORDINATOR_EMAIL || 'vansh.2002cv@gmail.com';

            await this.sendEmail({
                to: b2bCoordinatorEmail,
                subject,
                html,
                profile: 'DEFAULT',
                logData: {
                    name: `${data.firstName} ${data.lastName}`,
                    phone: data.mobile,
                    message: 'B2B Meeting Request Notification'
                }
            });

            console.log(`[B2B Notification] Sent to ${b2bCoordinatorEmail} for ${data.registrationId}`);
            return true;
        } catch (error) {
            console.error('Error sending B2B meeting notification:', error);
            return false;
        }
    }

    async sendExhibitorAdminAlert(registration) {
        try {
            const adminEmail = process.env.EXHIBITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
            if (!adminEmail) {
                console.warn('[ExhibitorAdminAlert] No EXHIBITOR_ADMIN_EMAIL set in env');
                return false;
            }

            const data = {
                registrationId: registration.registrationId,
                exhibitorName: registration.exhibitorName,
                typeOfBusiness: registration.typeOfBusiness,
                industrySector: registration.industrySector,
                website: registration.website,
                address: registration.address,
                city: registration.city,
                state: registration.state,
                country: registration.country,
                pincode: registration.pincode,
                gstNo: registration.gstNo,
                panNo: registration.panNo,
                contact1Title: registration.contact1?.title,
                contact1FirstName: registration.contact1?.firstName,
                contact1LastName: registration.contact1?.lastName,
                contact1Designation: registration.contact1?.designation,
                contact1Email: registration.contact1?.email,
                contact1Mobile: registration.contact1?.mobile,
                stallFor: registration.participation?.stallFor,
                stallType: registration.participation?.stallType,
                stallSize: registration.participation?.stallSize,
                dimension: registration.participation?.dimension,
                currency: registration.participation?.currency,
                totalAmount: registration.participation?.total,
                amountPaid: registration.amountPaid,
                balanceAmount: registration.balanceAmount,
                paymentMode: registration.paymentMode,
                eventName: registration.eventId?.name || 'IHWE 2026',
                referredBy: registration.referredBy,
                spokenWith: registration.spokenWith,
                filledBy: registration.filledBy,
                status: registration.status,
            };

            const html = getExhibitorAdminAlertTemplate(data);
            const subject = `New Exhibitor Booking | ${registration.exhibitorName} | Stall: ${registration.participation?.stallFor || 'N/A'} | ${registration.registrationId || ''}`;

            await this.sendEmail({
                to: adminEmail,
                subject,
                html,
                profile: 'DEFAULT',
                logData: {
                    name: registration.exhibitorName,
                    phone: registration.contact1?.mobile,
                    message: 'Exhibitor Admin Alert'
                }
            });

            console.log(`[ExhibitorAdminAlert] Sent to ${adminEmail} for ${registration.registrationId}`);
            return true;
        } catch (error) {
            console.error('[ExhibitorAdminAlert] Error:', error);
            return false;
        }
    }

    async sendDetailedVisitorNotification(data, recipientType = 'admin') {
        try {
            let subject, html;
            let recipientEmail;
            let logMessage;

            if (recipientType === 'b2b') {
                // B2B Coordinator gets Buyer Interest template (RED theme, high priority)
                subject = `Buyer Registration Interest Received | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getBuyerInterestAlertTemplate(data);
                recipientEmail = process.env.B2B_COORDINATOR_EMAIL || 'vansh.2002cv@gmail.com';
                logMessage = 'B2B Coordinator Notification';
            } else {
                // Admin gets responsive visitor alert template (GREEN theme, same design as B2B but green)
                subject = `New Visitor Registration Alert | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getResponsiveVisitorAlertTemplate(data);
                recipientEmail = process.env.VISITOR_ADMIN_EMAIL || 'virender.1974vc@gmail.com';
                logMessage = 'Admin Notification';
            }

            await this.sendEmail({
                to: recipientEmail,
                subject,
                html,
                profile: 'DEFAULT',
                logData: {
                    name: `${data.firstName} ${data.lastName}`,
                    phone: data.mobile,
                    message: logMessage
                }
            });

            console.log(`[${logMessage}] Sent to ${recipientEmail} for ${data.registrationId}`);
            return true;
        } catch (error) {
            console.error(`Error sending detailed visitor notification (${recipientType}):`, error);
            return false;
        }
    }

    async sendDetailedBuyerNotification(data) {
        try {
            const subject = `NEW BUYER REGISTRATION | IHWE 2026 | Reg ID: ${data.registrationId}`;
            const html = getBuyerRegistrationAlertTemplate(data);
            const recipientEmail = process.env.VISITOR_ADMIN_EMAIL || process.env.BUYER_ADMIN_EMAIL || 'virender.1974vc@gmail.com';

            await this.sendEmail({
                to: recipientEmail,
                subject,
                html,
                profile: 'DEFAULT',
                logData: {
                    name: data.fullName,
                    phone: data.mobileNumber,
                    message: 'Admin Buyer Alert'
                }
            });

            console.log(`[AdminBuyerAlert] Sent to ${recipientEmail} for ${data.registrationId}`);
            return true;
        } catch (error) {
            console.error('Error sending detailed buyer notification:', error);
            return false;
        }
    }

    async sendSpeakerNominationEmails(nomination) {
        return await this.sendDynamicConfirmation({
            to: nomination.email,
            formType: 'speaker-nomination',
            data: {
                full_name: nomination.fullName,
                topic: nomination.topic,
                expertise: nomination.expertise,
                designation: nomination.designation,
                organization: nomination.organization,
                city: nomination.city,
                phone: nomination.phone
            },
            profile: 'SPEAKER'
        });
    }

    async sendContactUsEmails(enquiry) {
        return await this.sendDynamicConfirmation({
            to: enquiry.email,
            formType: 'contact-enquiry',
            data: {
                name: enquiry.name,
                email: enquiry.email,
                phone: enquiry.phone,
                service: enquiry.service,
                message: enquiry.message
            },
            profile: 'CONTACT'
        });
    }

    async sendBuyerRegistrationEmails(data) {
        return await this.sendDynamicConfirmation({
            to: data.email,
            formType: 'buyer-registration',
            data: {
                name: data.contactPerson,
                company: data.companyName,
                email: data.email,
                phone: data.whatsapp,
                city: data.city,
                country: data.country
            },
            profile: 'DEFAULT'
        });
    }

    async sendRegistrationConfirmation(registration, pdfPath, rawPassword) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        let eventName = '9th Edition of International Health & Wellness Expo 2026 (IHWE Global Edition)';
        try {
            if (registration.eventId) {
                const Event = require('../models/Event');
                const event = await Event.findById(registration.eventId).select('name');
                if (event?.name) eventName = event.name;
            }
        } catch (_) { }

        const data = {
            exhibitor_name: registration.exhibitorName,
            stall_no: registration.participation?.stallFor || registration.participation?.stallNo || 'N/A',
            event_name: eventName,
            registrationId: registration.registrationId,
            login_url: loginUrl,
            username: registration.contact1.email,
            email: registration.contact1.email,
            password: rawPassword,
            phone: registration.contact1.mobile || registration.contact1.alternateNo
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
            bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');

            const getImageBuffer = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', imgPath.replace(/^\//, ''));
                    if (!require('fs').existsSync(absPath)) return null;
                    return require('fs').readFileSync(absPath);
                } catch (e) { return null; }
            };

            const headerBuf = getImageBuffer(template.headerImage);
            const footerBuf = getImageBuffer(template.footerImage);
            const html = this.emailShell(bodyContent, {
                headerCid: headerBuf ? 'email_header_img' : null,
                footerCid: footerBuf ? 'email_footer_img' : null,
                headerImage: template.headerImage || null,
                footerImage: template.footerImage || null,
            });

            const attachments = [];
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
                to: registration.contact1.email,
                subject,
                html,
                attachments,
                profile: 'EXHIBITOR',
                logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: 'Registration Confirmation + PDF' }
            });

            const mobile = data.phone;
            if (mobile && whatsappContent) {
                whatsapp.sendWhatsAppMessage(mobile, whatsappContent, 'Exhibitor Registration').catch(err => {
                    console.error('[WhatsApp] Exhibitor registration msg failed:', err.message);
                });
            }

            return sentToUser;
        } catch (error) {
            console.error('sendRegistrationConfirmation error:', error);
            return false;
        }
    }

    // Static content methods still use emailShell but without double escaping
    async sendPaymentReceipt(registration, pdfPath) {
        const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
        const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        const subject = `Payment Receipt - ${registration.exhibitorName} | ${registration.registrationId || ''}`;
        const html = this.emailShell(`
            <p>Dear <strong>${registration.exhibitorName}</strong>,</p>
            <p>Your payment has been received successfully. Here are your payment details:</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Registration ID</td><td style="padding:10px;">${registration.registrationId || 'N/A'}</td></tr>
                <tr><td style="padding:10px;font-weight:700;color:#166534;">Stall No.</td><td style="padding:10px;">${registration.participation?.stallFor || 'N/A'}</td></tr>
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Stall Type</td><td style="padding:10px;">${registration.participation?.stallType || 'N/A'}</td></tr>
                <tr><td style="padding:10px;font-weight:700;color:#166534;">Total Amount</td><td style="padding:10px;">${fmt(registration.participation?.total)}</td></tr>
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#23471d;">Amount Paid</td><td style="padding:10px;font-weight:700;color:#23471d;">${fmt(registration.amountPaid)}</td></tr>
                <tr><td style="padding:10px;font-weight:700;color:${registration.balanceAmount > 0 ? '#dc2626' : '#166534'};">Balance Due</td><td style="padding:10px;font-weight:700;color:${registration.balanceAmount > 0 ? '#dc2626' : '#166534'};">${fmt(registration.balanceAmount)}</td></tr>
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Payment Mode</td><td style="padding:10px;">${registration.paymentMode || 'N/A'}</td></tr>
                ${registration.paymentId ? `<tr><td style="padding:10px;font-weight:700;color:#166534;">Transaction ID</td><td style="padding:10px;">${registration.paymentId}</td></tr>` : ''}
            </table>
            ${registration.balanceAmount > 0 ? `<p style="color:#dc2626;font-weight:700;">⚠️ Balance amount of <strong>${fmt(registration.balanceAmount)}</strong> is pending. Please complete the payment at the earliest.</p>` : '<p style="color:#166534;font-weight:700;">✅ Your payment is fully settled. Thank you!</p>'}
            <p>Please find your payment receipt attached as a PDF.</p>
            <p>For any queries, please contact us.</p>
        `);

        const attachments = [];
        if (pdfPath && require('fs').existsSync(pdfPath)) {
            attachments.push({
                filename: `PaymentReceipt_${registration.registrationId || registration._id}.pdf`,
                path: pdfPath,
                contentType: 'application/pdf'
            });
        }

        return await this.sendEmail({
            to: registration.contact1.email,
            subject,
            html,
            attachments,
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: 'Payment Receipt + PDF' }
        });
    }

    async sendApprovalEmail(registration) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        return await this.sendDynamicConfirmation({
            to: registration.contact1.email,
            formType: 'exhibitor-registration',
            data: {
                exhibitor_name: registration.exhibitorName,
                stall_no: registration.participation?.stallFor || 'N/A',
                event_name: registration.eventId?.name || 'IHWE 2026',
                registrationId: registration.registrationId,
                login_url: loginUrl,
                username: registration.contact1.email,
                email: registration.contact1.email,
                status: 'Approved',
                phone: registration.contact1.mobile
            },
            profile: 'EXHIBITOR'
        });
    }

    async sendConfirmationEmail(registration) {
        const loginUrl = `${(process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '')}/exhibitor-login`;
        const cur = registration.participation?.currency === 'USD' ? '$' : '₹';
        const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        const subject = `Booking Confirmed! 🎊 - ${registration.exhibitorName} | ${registration.registrationId || ''}`;
        const html = this.emailShell(`
            <p>Dear <strong>${registration.exhibitorName}</strong>,</p>
            <p>🎊 Congratulations! Your stall booking for <strong>IHWE 2026</strong> is now <strong style="color:#23471d;">CONFIRMED</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Registration ID</td><td style="padding:10px;">${registration.registrationId || 'N/A'}</td></tr>
                <tr><td style="padding:10px;font-weight:700;color:#166534;">Stall No.</td><td style="padding:10px;font-weight:700;color:#d26019;">${registration.participation?.stallFor || 'N/A'}</td></tr>
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Stall Type</td><td style="padding:10px;">${registration.participation?.stallType || 'N/A'}</td></tr>
                <tr><td style="padding:10px;font-weight:700;color:#166534;">Event</td><td style="padding:10px;">${registration.eventId?.name || 'IHWE 2026'}</td></tr>
                <tr style="background:#f0fdf4;"><td style="padding:10px;font-weight:700;color:#166534;">Amount Paid</td><td style="padding:10px;font-weight:700;color:#23471d;">${fmt(registration.amountPaid)}</td></tr>
                ${registration.balanceAmount > 0 ? `<tr><td style="padding:10px;font-weight:700;color:#dc2626;">Balance Due</td><td style="padding:10px;font-weight:700;color:#dc2626;">${fmt(registration.balanceAmount)}</td></tr>` : ''}
            </table>
            <p>Login to your exhibitor portal: <a href="${loginUrl}" style="color:#23471d;font-weight:700;">${loginUrl}</a></p>
            <p>Username: <strong>${registration.contact1.email}</strong></p>
            <p>We look forward to seeing you at the expo!</p>
        `);
        return await this.sendEmail({ to: registration.contact1.email, subject, html, profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: 'Booking Confirmed' }
        });
    }

    async sendRejectionEmail(registration) {
        const subject = `Registration Update - ${registration.exhibitorName} | IHWE 2026`;
        const html = this.emailShell(`
            <p>Dear <strong>${registration.exhibitorName}</strong>,</p>
            <p>We regret to inform you that your registration application for <strong>IHWE 2026</strong> (Registration ID: <strong>${registration.registrationId || 'N/A'}</strong>) has not been approved at this time.</p>
            <p>This could be due to stall unavailability or incomplete documentation. Please contact our support team for more details.</p>
            <p>We hope to have you with us in future editions of IHWE.</p>
            <p>Thank you for your interest.</p>
        `);
        return await this.sendEmail({ to: registration.contact1.email, subject, html, profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: 'Registration Rejected' }
        });
    }

    async sendOtpEmail(email, otp, name) {
        const subject = 'IHWE Login - One Time Password (OTP)';
        const html = this.emailShell(`<div style="text-align: center;"><p>Hello <strong>${name}</strong>,</p><p>Your One Time Password (OTP) for IHWE access is:</p><div style="font-size: 32px; font-weight: 800; color: #d26019; letter-spacing: 5px; margin: 20px 0;">${otp}</div><p>Please do not share this OTP with anyone. It is valid for 10 minutes.</p></div>`);
        return await this.sendEmail({ to: email, subject, html });
    }

    async sendAccessoryOrderEmail(registration, order, pdfPath) {
        try {
            const email = registration.contact1?.email;
            if (!email) return false;

            const isComplimentary = order.paymentStatus === 'complimentary';
            const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

            const itemRows = order.items.map((item, i) => `
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:8px 12px;font-size:13px;">${i + 1}. ${item.name}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:center;">${item.qty}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:center;color:${item.type === 'complimentary' ? '#16a34a' : '#d26019'};font-weight:700;">${item.type === 'complimentary' ? 'FREE' : 'Paid'}</td>
                    <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:700;">${item.type === 'complimentary' ? 'Complimentary' : fmt(item.totalPrice)}</td>
                </tr>
            `).join('');

            const subject = `Accessory Order Confirmation – ${order.orderNo} | IHWE 2026`;
            const html = this.emailShell(`
                <p>Dear <strong>${registration.exhibitorName}</strong>,</p>
                <p>Your accessory order has been successfully processed for <strong>IHWE 2026</strong>.</p>
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
                    <tfoot>
                        <tr style="background:#f9fafb;">
                            <td colspan="3" style="padding:10px 12px;font-weight:700;font-size:13px;">Grand Total</td>
                            <td style="padding:10px 12px;font-weight:800;font-size:14px;text-align:right;color:#23471d;">${isComplimentary ? 'Complimentary' : fmt(order.grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
                <p><strong>Order No:</strong> ${order.orderNo}</p>
                <p><strong>Stall No:</strong> ${registration.participation?.stallFor || 'N/A'}</p>
                <p><strong>Registration ID:</strong> ${registration.registrationId || 'N/A'}</p>
                ${order.transactionId ? `<p><strong>Transaction ID:</strong> ${order.transactionId}</p>` : ''}
                <p>Please find your receipt attached. For any queries, contact us at <a href="mailto:info@ihwe.in">info@ihwe.in</a>.</p>
            `);

            const attachments = [];
            if (pdfPath && require('fs').existsSync(pdfPath)) {
                attachments.push({ filename: `Accessory_Receipt_${order.orderNo}.pdf`, path: pdfPath });
            }

            return await this.sendEmail({
                to: email,
                subject,
                html,
                attachments,
                profile: 'EXHIBITOR',
                logData: { name: registration.exhibitorName, phone: registration.contact1?.mobile, message: `Accessory Order ${order.orderNo}` }
            });
        } catch (err) {
            console.error('sendAccessoryOrderEmail error:', err.message);
            return false;
        }
    }
}

module.exports = new EmailService();
