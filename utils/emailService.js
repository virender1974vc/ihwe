const nodemailer = require('nodemailer');
const fs = require('fs');
const QRCode = require('qrcode');
const EmailLog = require('../models/EmailLog');
const whatsapp = require('./whatsapp');

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
            'COMPANY': data.companyName || data.organization || data.organizationName || 'N/A',
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

            // For corporate/general visitor: generate QR code as CID attachment
            if ((formType === 'corporate-visitor' || formType === 'general-visitor') && data.registrationId) {
                try {
                    const frontendUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                    const routePrefix = formType === 'corporate-visitor' ? 'visitor' : 'visitor';
                    const scanUrl = `${frontendUrl}/${routePrefix}?id=${encodeURIComponent(data.registrationId)}`;
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

            // 3. Notify ADMIN (Leads)
            await this.notifyAdmin(formType, data, subject, profile).catch(err => {
                console.error(`[AdminNotification] Failed for ${formType}:`, err.message);
            });

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
        return await this.sendDynamicConfirmation({
            to: registration.contact1.email,
            formType: 'exhibitor-registration',
            data: {
                exhibitor_name: registration.exhibitorName,
                stall_no: registration.participation?.stallFor || registration.participation?.stallNo || 'N/A',
                event_name: registration.eventName || 'IHWE 2026',
                login_url: 'https://ihwe.in/exhibitor-login',
                username: registration.contact1.email,
                email: registration.contact1.email,
                password: rawPassword,
                phone: registration.contact1.mobile || registration.contact1.alternateNo
            },
            profile: 'EXHIBITOR'
        });
    }

    // Static content methods still use emailShell but without double escaping
    async sendPaymentReceipt(registration, pdfPath) {
        const subject = 'Payment Receipt - ' + registration.exhibitorName;
        const html = this.emailShell(`<p>Dear ${registration.exhibitorName}, your payment has been received successfully. Please find the receipt attached.</p>`);
        return await this.sendEmail({ to: registration.contact1.email, subject, html, profile: 'EXHIBITOR' });
    }

    async sendApprovalEmail(registration) {
        return await this.sendDynamicConfirmation({
            to: registration.contact1.email,
            formType: 'exhibitor-registration',
            data: { exhibitor_name: registration.exhibitorName, status: 'Approved' },
            profile: 'EXHIBITOR'
        });
    }

    async sendOtpEmail(email, otp, name) {
        const subject = 'IHWE Login - One Time Password (OTP)';
        const html = this.emailShell(`<div style="text-align: center;"><p>Hello <strong>${name}</strong>,</p><p>Your One Time Password (OTP) for IHWE access is:</p><div style="font-size: 32px; font-weight: 800; color: #d26019; letter-spacing: 5px; margin: 20px 0;">${otp}</div><p>Please do not share this OTP with anyone. It is valid for 10 minutes.</p></div>`);
        return await this.sendEmail({ to: email, subject, html });
    }
}

module.exports = new EmailService();
