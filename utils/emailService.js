const nodemailer = require('nodemailer');
const fs = require('fs');
const EmailLog = require('../models/EmailLog');
const whatsapp = require('./whatsapp');
const { getResponsiveVisitorAlertTemplate } = require('./emailTemplates/responsiveVisitorAlert');
const { getBuyerInterestAlertTemplate } = require('./emailTemplates/buyerInterestAlert');

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

        this.emailShell = (body) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 30px; text-align: center; color: white; }
                .content { padding: 40px; background: #ffffff; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #23471d; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; transition: background 0.3s ease; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size: 22px;">9th International Health & Wellness Expo</h1>
                    <p style="margin:5px 0 0; opacity: 0.8; font-size: 14px;">Global Health Connect | IHWE 2026</p>
                </div>
                <div class="content">
                    ${body}
                </div>
                <div class="footer">
                    <p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p>
                    <p>Namo Gange Trust Foundation</p>
                </div>
            </div>
        </body>
        </html>
        `;

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
                // We'll still send a basic notification if template is missing but the logic triggered it
                return false;
            }

            const subject = this.applyPlaceholders(template.emailSubject, data);
            const bodyContent = this.applyPlaceholders(template.emailBody, data);
            const html = this.emailShell(bodyContent);

            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);

            // 1. Send Email to USER
            const sentToUser = await this.sendEmail({
                to,
                subject,
                html,
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

            // 3. Notify ADMIN (Leads) - Send to both Department Admin and Global Admin
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
        
        // For corporate visitors, only send to user (not admin - admin gets new template separately)
        if (data.visitorType.toLowerCase().includes('corporate')) {
            return await this.sendVisitorConfirmationOnly(data, type);
        }
        
        // For other visitors, use normal flow with admin notification
        return await this.sendDynamicConfirmation({
            to: data.email,
            formType: type,
            data,
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
            const bodyContent = this.applyPlaceholders(template.emailBody, data);
            const html = this.emailShell(bodyContent);
            const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);

            // 1. Send Email to USER only (no admin notification)
            const sentToUser = await this.sendEmail({
                to: data.email,
                subject,
                html,
                profile: 'VISITOR',
                logData: { name: data.firstName || data.name, phone: data.mobile || data.phone, message: `Visitor Confirmation (${formType})` }
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

    async sendDetailedVisitorNotification(data, recipientType = 'admin') {
        try {
            let subject, html;
            let recipientEmail;
            let logMessage;
            
            if (recipientType === 'b2b') {
                // B2B Coordinator gets Buyer Interest template
                subject = `Buyer Registration Interest Received | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getBuyerInterestAlertTemplate(data);
                recipientEmail = process.env.B2B_COORDINATOR_EMAIL || 'vansh.2002cv@gmail.com';
                logMessage = 'B2B Coordinator Notification';
            } else {
                // Admin gets standard visitor alert template
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
