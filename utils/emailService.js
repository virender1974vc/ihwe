const nodemailer = require('nodemailer');
const fs = require('fs');
const EmailLog = require('../models/EmailLog');

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
                fromName = process.env.VISITOR_FROM_NAME || "IHWE Visitor Portal";
            } else if (profile === 'EXHIBITOR') {
                transporter = this.exhibitorTransporter;
                fromEmail = process.env.EXHIBITOR_FROM_EMAIL || fromEmail;
                fromName = process.env.EXHIBITOR_FROM_NAME || "IHWE Exhibitor Portal";
            }

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
                attachments: attachments.map(item => ({
                    filename: item.filename,
                    path: item.path
                })),
            };

            const info = await transporter.sendMail(mailOptions);

            // Log Success
            await EmailLog.create({
                recipient: to,
                subject,
                status: 'success',
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null
            });

            attachments.forEach(item => {
                if (fs.existsSync(item.path)) {
                    fs.unlinkSync(item.path);
                }
            });

            return info;
        } catch (error) {
            console.error('Email sending failed:', error);

            // Log Failure
            await EmailLog.create({
                recipient: to,
                subject,
                status: 'failed',
                error: error.message,
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null
            });

            throw error;
        }
    }
    async sendRegistrationConfirmation(registration, pdfPath, rawPassword = null) {
        const portalUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/exhibitor-login` : 'http://localhost:5173/exhibitor-login';
        const stallDisplay = registration.participation?.stallFor || registration.participation?.stallNo || 'N/A';
        const eventName = registration.eventId?.name || 'Global Healthcare Excellence 2026';
        const eventDate = registration.eventId?.date ? new Date(registration.eventId.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
        const eventVenue = registration.eventId?.venue || registration.eventId?.location || null;

        let loginBlocks = '';
        if (rawPassword) {
            loginBlocks = `
                <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #166534; margin-top: 0; margin-bottom: 12px; font-size: 16px; text-transform: uppercase;">Exhibitor Portal Access</h3>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534;">You can track your registration status and download payment receipts via your dedicated dashboard.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; width: 120px; color: #166534; font-weight: bold; font-size: 12px; text-transform: uppercase;">Login URL:</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><a href="${portalUrl}" style="color: #2563eb; font-weight: bold; text-decoration: none;">${portalUrl}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; color: #166534; font-weight: bold; font-size: 12px; text-transform: uppercase;">User ID:</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; color: #000; font-weight: bold;">${registration.contact1.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #166534; font-weight: bold; font-size: 12px; text-transform: uppercase;">Password:</td>
                            <td style="padding: 8px 0; color: #000; font-weight: bold; font-family: monospace; font-size: 16px; letter-spacing: 2px;">${rawPassword}</td>
                        </tr>
                    </table>
                    <p style="margin: 0; font-size: 11px; color: #15803d;"><i>For security, please do not share your password. Login requires OTP verification to your registered mobile number (${registration.contact1.mobile}).</i></p>
                </div>
            `;
        }

        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #23471d;">Registration Successful!</h2>
                <p>Dear ${registration.exhibitorName},</p>
                <p>Thank you for registering for the <b>${eventName}</b>. Your application for stall <b>${stallDisplay}</b> has been received and is currently under review.</p>
                ${eventDate || eventVenue ? '<p style="color:#555; font-size:13px;">\u{1F4C5} ' + (eventDate || '') + (eventVenue ? ' \u00B7 \u{1F4CD} ' + eventVenue : '') + '</p>' : ''}
                
                ${loginBlocks}

                <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <p><b>Registration Status:</b> <span style="color: #d26019; font-weight: bold; text-transform: uppercase;">PENDING REVIEW</span></p>
                    <p><b>Stall No:</b> ${stallDisplay}</p>
                    <p><b>Total Amount:</b> ${registration.currency || 'INR'} ${registration.participation?.total?.toLocaleString()}</p>
                </div>

                <p>We have attached a copy of your registration form for your records. Our team will contact you shortly to guide you through the next steps.</p>
                
                <p style="margin-top: 30px;">Best Regards,<br/><b>Team Namo Gange Trust</b><br/><small>Health & Wellness Expo 2026</small></p>
            </div>
        `;

        return this.sendEmail({
            to: registration.contact1.email,
            subject: `Registration Form: ${registration.exhibitorName} - Global Healthcare Excellence 2026`,
            html,
            attachments: [{ filename: `Registration_Form_${registration.exhibitorName}.pdf`, path: pdfPath }],
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1.mobile, message: `New registration form submitted for ${stallDisplay}.` }
        });
    }
    async sendPaymentReceipt(registration, pdfPath) {
        const stallDisplay = registration.participation?.stallFor || registration.participation?.stallNo || 'N/A';
        const eventName = registration.eventId?.name || 'Global Healthcare Excellence 2026';

        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #23471d;">Payment Received Successfully</h2>
                <p>Dear ${registration.exhibitorName},</p>
                <p>This is to confirm that we have received a payment of <b>${registration.currency || 'INR'} ${registration.amountPaid.toLocaleString()}</b> towards your stall booking for <b>${eventName}</b>.</p>
                
                <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><b>Receipt No:</b> REC-${registration._id.toString().slice(-6).toUpperCase()}</p>
                    <p><b>Stall No:</b> ${stallDisplay}</p>
                    <p><b>Transaction Status:</b> <span style="color: #1a3516; font-weight: bold;">VERIFIED</span></p>
                </div>

                <p>Please find the official payment receipt attached to this email.</p>
                
                <p style="margin-top: 30px;">Best Regards,<br/><b>Accounts Team</b><br/><b>Namo Gange Trust Foundation</b></p>
            </div>
        `;

        return this.sendEmail({
            to: registration.contact1.email,
            subject: `Official Payment Receipt: ${registration.exhibitorName} - REC-${registration._id.toString().slice(-6).toUpperCase()}`,
            html,
            attachments: [{ filename: `Payment_Receipt_${registration.exhibitorName}.pdf`, path: pdfPath }],
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1.mobile, message: `Payment receipt sent for stall ${stallDisplay}.` }
        });
    }
    async sendApprovalEmail(registration) {
        const portalUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/exhibitor-login` : 'http://localhost:5173/exhibitor-login';
        const stallDisplay = registration.participation?.stallFor || registration.participation?.stallNo || 'N/A';
        const eventName = registration.eventId?.name || 'Global Healthcare Excellence 2026';
        const eventDate = registration.eventId?.date ? new Date(registration.eventId.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
        const eventVenue = registration.eventId?.venue || registration.eventId?.location || null;

        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #23471d;">Registration Approved!</h2>
                <p>Dear ${registration.exhibitorName},</p>
                <p>We are pleased to inform you that your registration for <b>${eventName}</b> has been <b style="color: #16a34a;">APPROVED</b>.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
                    <p><b>Stall No:</b> ${stallDisplay}</p>
                    <p><b>Total Amount:</b> ${registration.currency || 'INR'} ${registration.participation?.total?.toLocaleString()}</p>
                    ${eventDate ? '<p><b>Event Date:</b> ' + eventDate + '</p>' : ''}
                    ${eventVenue ? '<p><b>Venue:</b> ' + eventVenue + '</p>' : ''}
                    <p><b>Status:</b> <span style="color: #16a34a; font-weight: bold; text-transform: uppercase;">APPROVED</span></p>
                </div>

                <p>Please login to your exhibitor portal to complete the payment and next steps.</p>
                <p><a href="${portalUrl}" style="background: #23471d; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px;">Login to Portal</a></p>

                <p style="margin-top: 30px;">Best Regards,<br/><b>Team Namo Gange Trust</b><br/><small>Health & Wellness Expo 2026</small></p>
            </div>
        `;

        return this.sendEmail({
            to: registration.contact1.email,
            subject: `Registration Approved: ${registration.exhibitorName} - Global Healthcare Excellence 2026`,
            html,
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1.mobile, message: `Registration approved for stall ${stallDisplay}.` }
        });
    }

    async sendOtpEmail(to, otp, name) {
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 500px; margin: auto; padding: 0;">
                <div style="background: #23471d; padding: 24px 32px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">Exhibitor Portal Login</h2>
                    <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 13px;">Health & Wellness Expo 2026</p>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 10px 10px;">
                    <p style="margin: 0 0 16px;">Dear <b>${name}</b>,</p>
                    <p style="margin: 0 0 24px; color: #555;">Use the OTP below to complete your login. It is valid for <b>10 minutes</b>.</p>
                    <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.1em;">Your One-Time Password</p>
                        <p style="margin: 0; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #d26019; font-family: monospace;">${otp}</p>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Do not share this OTP with anyone. If you did not request this, please ignore this email.</p>
                </div>
            </div>
        `;
        return this.sendEmail({ to, subject: 'Login OTP - Exhibitor Portal | IHWE 2026', html });
    }

    async sendRejectionEmail(registration) {
        let stallDisplay = registration.participation?.stallFor || registration.participation?.stallNo;
        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 0;">
                <div style="background: #7f1d1d; padding: 24px 32px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">Application Update</h2>
                    <p style="color: #fca5a5; margin: 4px 0 0; font-size: 13px;">Global Healthcare Excellence 2026</p>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 10px 10px;">
                    <p>Dear <b>${registration.exhibitorName}</b>,</p>
                    <p>We regret to inform you that your registration application for <b>Global Healthcare Excellence 2026</b> has not been approved at this time.</p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0 0 8px;"><b>Stall Applied For:</b> ${stallDisplay || 'N/A'}</p>
                        <p style="margin: 0;"><b>Status:</b> <span style="color: #dc2626; font-weight: bold;">NOT APPROVED</span></p>
                    </div>
                    <p>If you believe this is an error or would like to discuss further, please contact our team.</p>
                    <p style="margin-top: 30px;">Best Regards,<br/><b>Team Namo Gange Trust</b><br/><small>Health & Wellness Expo 2026</small></p>
                </div>
            </div>
        `;
        return this.sendEmail({
            to: registration.contact1.email,
            subject: `Application Status Update - Global Healthcare Excellence 2026`,
            html,
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1.mobile, message: `Application rejected/not approved.` }
        });
    }

    async sendConfirmationEmail(registration) {
        const stallDisplay = registration.participation?.stallFor || registration.participation?.stallNo || 'N/A';
        const eventName = registration.eventId?.name || 'Global Healthcare Excellence 2026';
        const eventDate = registration.eventId?.date ? new Date(registration.eventId.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
        const eventVenue = registration.eventId?.venue || registration.eventId?.location || null;

        const html = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 0;">
                <div style="background: #1e3a8a; padding: 24px 32px; border-radius: 10px 10px 0 0;">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">Booking Confirmed!</h2>
                    <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 13px;">${eventName}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 10px 10px;">
                    <p>Dear <b>${registration.exhibitorName}</b>,</p>
                    <p>Congratulations! Your stall booking is now <b style="color: #2563eb;">CONFIRMED</b>.</p>
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                        <p><b>Stall No:</b> ${stallDisplay}</p>
                        <p><b>Total Amount:</b> ${registration.currency || 'INR'} ${registration.participation?.total?.toLocaleString()}</p>
                        <p><b>Amount Paid:</b> ${registration.currency || 'INR'} ${registration.amountPaid?.toLocaleString()}</p>
                        ${eventDate ? '<p><b>Event Date:</b> ' + eventDate + '</p>' : ''}
                        ${eventVenue ? '<p><b>Venue:</b> ' + eventVenue + '</p>' : ''}
                        <p><b>Status:</b> <span style="color: #2563eb; font-weight: bold; text-transform: uppercase;">CONFIRMED</span></p>
                    </div>
                    <p>We look forward to welcoming you at the event. Our team will reach out with further details closer to the event date.</p>
                    <p style="margin-top: 30px;">Best Regards,<br/><b>Team Namo Gange Trust</b><br/><small>Health & Wellness Expo 2026</small></p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: registration.contact1.email,
            subject: `Booking Confirmed: ${registration.exhibitorName} - ${eventName}`,
            html,
            profile: 'EXHIBITOR',
            logData: { name: registration.exhibitorName, phone: registration.contact1.mobile, message: `Stall booking confirmed for ${stallDisplay}.` }
        });
    }

    async sendContactUsEmails(enquiry) {
        const { name, email, phone, service, message } = enquiry;
        const siteUrl = process.env.SITE_URL || 'https://ihwe.in';
        const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

        // 1. Template for the User (Confirmation)
        const userHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white; }
                .content { padding: 40px; background: #ffffff; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                .greeting { font-size: 24px; color: #1e3a8a; margin-bottom: 20px; font-weight: 600; }
                .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; }
                .info-item { margin-bottom: 15px; }
                .info-label { font-weight: bold; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
                .info-value { color: #1e293b; font-size: 15px; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; transition: background 0.3s ease; }
                .highlight { color: #d97706; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size: 22px;">Global Health Connect</h1>
                    <p style="margin:5px 0 0; opacity: 0.8; font-size: 14px;">9th International Health & Wellness Expo</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello, ${name}!</div>
                    <p>Thank you for reaching out to us. We have successfully received your inquiry regarding <span class="highlight">${service}</span>.</p>
                    <p>Our dedicated team is already reviewing your request and will get back to you within <span class="highlight">24-48 business hours</span>.</p>
                    
                    <div class="summary-card">
                        <div style="font-weight: 700; margin-bottom: 15px; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Enquiry Summary</div>
                        <div class="info-item">
                            <span class="info-label">Mobile Number</span>
                            <span class="info-value">${phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Your Message</span>
                            <span class="info-value">"${message}"</span>
                        </div>
                    </div>
                    
                    <p>In the meantime, feel free to explore our website for more information about the upcoming expo.</p>
                    <a href="${siteUrl}" class="btn">Visit Website</a>
                </div>
                <div class="footer">
                    <p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p>
                    <p>Namo Gange Trust Foundation</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // 2. Template for the Admin (Notification)
        const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #374151; background-color: #f3f4f6; padding: 20px; }
                .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                .banner { background-color: #065f46; color: white; padding: 24px; text-align: center; }
                .main-content { padding: 32px; }
                .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 24px; text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 16px; }
                .data-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                .data-row td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                .label { font-weight: 600; color: #6b7280; width: 140px; }
                .value { color: #111827; }
                .message-box { background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-top: 10px; font-size: 14px; color: #4b5563; font-style: italic; }
                .cta-row { text-align: center; margin-top: 32px; }
                .admin-pill { display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #065f46; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="banner">
                    <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">NEW CONTACT ENQUIRY</h1>
                </div>
                <div class="main-content">
                    <div style="text-align: center;"><span class="admin-pill">Urgent Response Required</span></div>
                    <div class="title">Lead Details from ${name}</div>
                    
                    <table class="data-grid">
                        <tr class="data-row">
                            <td class="label">Full Name</td>
                            <td class="value">${name}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Email Address</td>
                            <td class="value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Phone Number</td>
                            <td class="value"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a></td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Inquiry For</td>
                            <td class="value" style="font-weight: 700; color: #065f46;">${service}</td>
                        </tr>
                    </table>

                    <div style="font-weight: 600; color: #6b7280; font-size: 14px; margin-bottom: 8px;">Customer's Message:</div>
                    <div class="message-box">
                        "${message}"
                    </div>

                    <div class="cta-row">
                        <p style="font-size: 12px; color: #9ca3af; margin-bottom: 16px;">This inquiry was submitted through the IHWE Contact Page.</p>
                        <a href="${siteUrl}/admin" style="background-color: #111827; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            console.log(`[EmailService] Sending contact confirmation to user: ${email}`);
            // Send to User
            await this.sendEmail({
                to: email,
                subject: `We've received your message! - Global Health Connect`,
                html: userHtml,
                useContactSMTP: true,
                logData: { name, phone, message }
            });
            console.log(`[EmailService] User email sent successfully`);

            console.log(`[EmailService] Sending inquiry notification to admin: ${adminEmail}`);
            // Send to Admin
            await this.sendEmail({
                to: adminEmail,
                subject: `NEW CONTACT ENQUIRY: ${name} - ${service}`,
                html: adminHtml,
                useContactSMTP: true,
                logData: { name, phone, message }
            });
            console.log(`[EmailService] Admin email sent successfully`);

            return true;
        } catch (error) {
            console.error('[EmailService] Error sending contact emails:', error);
            return false;
        }
    }

    async sendSpeakerNominationEmails(nomination) {
        const { title, firstName, lastName, officialEmail, mobileNo, organizationName, designation, areaOfExpertise, proposedTopic, shortBiography, linkedinUrl, country, state, city } = nomination;
        const fullName = `${title.toUpperCase()} ${firstName} ${lastName}`;
        const siteUrl = process.env.SITE_URL || 'https://ihwe.in';
        const speakerAdminEmail = process.env.SPEAKER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

        // 1. Template for the Speaker (User Confirmation)
        const userHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 35px 30px; text-align: center; color: white; }
                .content { padding: 40px; background: #ffffff; }
                .footer { background: #f9fafb; padding: 25px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                .greeting { font-size: 22px; color: #23471d; margin-bottom: 20px; font-weight: 600; }
                .status-badge { display: inline-block; padding: 6px 16px; background: #f0fdf4; color: #166534; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 25px; border: 1px solid #bbf7d0; }
                .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 25px 0; }
                .info-item { margin-bottom: 18px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
                .info-item:last-child { border: none; margin: 0; padding: 0; }
                .info-label { font-weight: bold; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
                .info-value { color: #1a202c; font-size: 14px; font-weight: 500; }
                .btn { display: inline-block; padding: 14px 28px; background-color: #23471d; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 25px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(35,71,29,0.2); }
                .highlight { color: #d97706; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size: 24px; letter-spacing: 1px;">SPEAKER NOMINATION</h1>
                    <p style="margin:8px 0 0; opacity: 0.9; font-size: 14px; font-weight: 300;">IHWE 2026 | Global Healthcare Excellence</p>
                </div>
                <div class="content">
                    <div class="status-badge">Application Under Review</div>
                    <div class="greeting">Dear ${fullName},</div>
                    <p>Thank you for nominating yourself as a speaker for the <b>9th International Health & Wellness Expo 2026</b>.</p>
                    <p>We are honored by your interest in sharing your expertise with our global audience. Our program committee is currently reviewing your proposal regarding <span class="highlight">"${proposedTopic}"</span>.</p>
                    
                    <div class="summary-box">
                        <div style="font-weight: 800; margin-bottom: 20px; color: #2d3748; font-size: 13px; text-transform: uppercase; border-left: 3px solid #d26019; padding-left: 10px;">Submission Overview</div>
                        <div class="info-item">
                            <span class="info-label">Current Designation</span>
                            <span class="info-value">${designation} at ${organizationName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Expertise Area</span>
                            <span class="info-value">${areaOfExpertise}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Topic of Discussion</span>
                            <span class="info-value">${proposedTopic}</span>
                        </div>
                    </div>
                    
                    <p>Our team will contact you within <span class="highlight">7-10 business hours</span> to discuss the next steps of the selection process.</p>
                    <div style="text-align: center;">
                        <a href="${siteUrl}/conference" class="btn">Learn About Conference</a>
                    </div>
                </div>
                <div class="footer">
                    <p style="font-weight: 600; color: #4a5568; margin-bottom: 5px;">Scientific Committee | IHWE 2026</p>
                    <p>&copy; 2026 IHWE | Namo Gange Trust. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // 2. Template for the Admin (Notification)
        const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #374151; background-color: #f3f4f6; padding: 20px; }
                .email-wrapper { max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .banner { background-color: #1e293b; color: white; padding: 30px; text-align: center; }
                .main-content { padding: 40px; }
                .section-title { font-size: 13px; font-weight: 800; color: #d26019; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                .data-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .data-row td { padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
                .label { font-weight: 600; color: #64748b; width: 160px; }
                .value { color: #0f172a; font-weight: 500; }
                .bio-box { background-color: #f8fafc; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0; margin: 10px 0 30px; font-size: 14px; color: #334155; line-height: 1.7; font-style: italic; }
                .topic-highlight { font-size: 18px; color: #1e293b; font-weight: 700; margin-bottom: 10px; display: block; border-left: 4px solid #23471d; padding-left: 15px; }
                .linkedin-pill { display: inline-block; padding: 5px 15px; background-color: #eff6ff; color: #1d4ed8; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid #dbeafe; }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="banner">
                    <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">NEW SPEAKER NOMINATION</h1>
                    <p style="margin: 5px 0 0; opacity: 0.7; font-size: 13px;">Review required for scientific program session</p>
                </div>
                <div class="main-content">
                    <div class="section-title">Expert Profile</div>
                    <table class="data-grid">
                        <tr class="data-row">
                            <td class="label">Full Name</td>
                            <td class="value">${fullName}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Expertise Area</td>
                            <td class="value" style="color: #23471d; font-weight: 700;">${areaOfExpertise}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Official Email</td>
                            <td class="value"><a href="mailto:${officialEmail}" style="color: #2563eb; text-decoration: none;">${officialEmail}</a></td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Mobile Number</td>
                            <td class="value">${mobileNo}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Organization</td>
                            <td class="value">${organizationName}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Designation</td>
                            <td class="value">${designation}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Location</td>
                            <td class="value">${city}, ${state}, ${country}</td>
                        </tr>
                    </table>

                    <div style="margin-bottom: 30px;">
                        <a href="${linkedinUrl}" class="linkedin-pill">View LinkedIn Profile</a>
                    </div>

                    <div class="section-title">Scientific Contribution</div>
                    <span class="topic-highlight">${proposedTopic}</span>
                    
                    <div style="font-weight: 600; color: #64748b; font-size: 13px; margin: 20px 0 5px;">Professional Biography:</div>
                    <div class="bio-box">
                        "${shortBiography}"
                    </div>

                    <div style="text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; pt-20px;">
                        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">This nomination was submitted via the IHWE Speaker Portal.</p>
                        <a href="${siteUrl}/admin" style="background-color: #1e293b; color: white; padding: 12px 35px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">Open Admin Console</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            console.log(`[EmailService] Sending speaker confirmation to user: ${officialEmail}`);
            // Send to Speaker
            await this.sendEmail({
                to: officialEmail,
                subject: `Speaker Nomination Received - Global Health Connect | IHWE 2026`,
                html: userHtml,
                useContactSMTP: true,
                logData: { name: fullName, phone: mobileNo, message: `Speaker Nomination for topic: ${proposedTopic}` }
            });

            console.log(`[EmailService] Sending speaker nomination notification to admin: ${speakerAdminEmail}`);
            // Send to Admin
            await this.sendEmail({
                to: speakerAdminEmail,
                subject: `NEW SPEAKER NOMINATION: ${fullName} - ${areaOfExpertise}`,
                html: adminHtml,
                useContactSMTP: true,
                logData: { name: fullName, phone: mobileNo, message: `Expert nomination received for Scientific Session.` }
            });

            return true;
        } catch (error) {
            console.error('[EmailService] Error sending speaker nomination emails:', error);
            return false;
        }
    }

    async sendVisitorRegistrationEmails(registration) {
        const { firstName, lastName, email, mobileNo, visitorType, purposeOfVisit, areaOfInterest, city, country } = registration;
        const fullName = `${firstName} ${lastName}`;
        const siteUrl = process.env.SITE_URL || 'https://ihwe.in';
        const visitorAdminEmail = process.env.VISITOR_ADMIN_EMAIL || 'virender.1974vc@gmail.com';

        // 1. Template for the Visitor (Confirmation)
        const userHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; border: 1px solid #e1e1e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #d26019 0%, #a84c14 100%); padding: 35px 30px; text-align: center; color: white; }
                .content { padding: 40px; background: #ffffff; }
                .footer { background: #f9fafb; padding: 25px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
                .greeting { font-size: 22px; color: #d26019; margin-bottom: 20px; font-weight: 600; }
                .status-badge { display: inline-block; padding: 6px 16px; background: #fff7ed; color: #9a3412; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 25px; border: 1px solid #ffedd5; }
                .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 25px 0; }
                .info-item { margin-bottom: 18px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
                .info-item:last-child { border: none; margin: 0; padding: 0; }
                .info-label { font-weight: bold; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
                .info-value { color: #1a202c; font-size: 14px; font-weight: 500; }
                .btn { display: inline-block; padding: 14px 28px; background-color: #d26019; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 25px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(210,96,25,0.2); }
                .highlight { color: #23471d; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size: 24px; letter-spacing: 1px;">VISITOR REGISTRATION</h1>
                    <p style="margin:8px 0 0; opacity: 0.9; font-size: 14px; font-weight: 300;">IHWE 2026 | Global Healthcare Excellence</p>
                </div>
                <div class="content">
                    <div class="status-badge">Confirmed Registration</div>
                    <div class="greeting">Dear ${fullName},</div>
                    <p>Thank you for registering as a <span class="highlight">${visitorType}</span> for the <b>9th International Health & Wellness Expo 2026</b>.</p>
                    <p>We are excited to have you join us at the premier health and wellness event of the year. Your registration is now confirmed.</p>
                    
                    <div class="summary-box">
                        <div style="font-weight: 800; margin-bottom: 20px; color: #2d3748; font-size: 13px; text-transform: uppercase; border-left: 3px solid #23471d; padding-left: 10px;">Registration Summary</div>
                        <div class="info-item">
                            <span class="info-label">Visitor Category</span>
                            <span class="info-value">${visitorType}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Purpose of Visit</span>
                            <span class="info-value">${Array.isArray(purposeOfVisit) ? purposeOfVisit.join(', ') : (purposeOfVisit || 'General Interest')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Area of Interest</span>
                            <span class="info-value">${Array.isArray(areaOfInterest) ? areaOfInterest.join(', ') : (areaOfInterest || 'N/A')}</span>
                        </div>
                    </div>
                    
                    <p>You can download your entry badge on our website closer to the exhibition date.</p>
                    <div style="text-align: center;">
                        <a href="${siteUrl}/visit" class="btn">Exhibitor List & Floor Plan</a>
                    </div>
                </div>
                <div class="footer">
                    <p style="font-weight: 600; color: #4a5568; margin-bottom: 5px;">Visitor Relations | IHWE 2026</p>
                    <p>&copy; 2026 IHWE | Namo Gange Trust. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // 2. Template for the Admin (Notification)
        const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #374151; background-color: #f3f4f6; padding: 20px; }
                .email-wrapper { max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .banner { background-color: #d26019; color: white; padding: 30px; text-align: center; }
                .main-content { padding: 40px; }
                .section-title { font-size: 13px; font-weight: 800; color: #23471d; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                .data-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .data-row td { padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
                .label { font-weight: 600; color: #64748b; width: 160px; }
                .value { color: #0f172a; font-weight: 500; }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="banner">
                    <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">NEW VISITOR REGISTRATION</h1>
                    <p style="margin: 5px 0 0; opacity: 0.7; font-size: 13px;">Lead generated via Visitor Portal</p>
                </div>
                <div class="main-content">
                    <div class="section-title">Visitor Basic Info</div>
                    <table class="data-grid">
                        <tr class="data-row">
                            <td class="label">Full Name</td>
                            <td class="value">${fullName}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Visitor Type</td>
                            <td class="value" style="color: #d26019; font-weight: 700;">${visitorType}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Email Address</td>
                            <td class="value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Mobile Number</td>
                            <td class="value">${mobileNo}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Location</td>
                            <td class="value">${city}, ${country}</td>
                        </tr>
                    </table>

                    <div class="section-title">Professional Interest</div>
                    <table class="data-grid">
                        <tr class="data-row">
                            <td class="label">Purpose</td>
                            <td class="value">${Array.isArray(purposeOfVisit) ? purposeOfVisit.join(', ') : (purposeOfVisit || 'N/A')}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="label">Interests</td>
                            <td class="value">${Array.isArray(areaOfInterest) ? areaOfInterest.join(', ') : (areaOfInterest || 'N/A')}</td>
                        </tr>
                    </table>

                    <div style="text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; pt-20px;">
                        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">This registration was submitted via the IHWE Visitor Portal.</p>
                        <a href="${siteUrl}/admin" style="background-color: #23471d; color: white; padding: 12px 35px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">Open Admin Console</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            console.log(`[EmailService] Sending visitor confirmation to user: ${email}`);
            await this.sendEmail({
                to: email,
                subject: `Welcome to IHWE 2026 - Registration Confirmed!`,
                html: userHtml,
                profile: 'VISITOR',
                logData: { name: fullName, phone: mobileNo, message: `Visitor Registration confirmed for category: ${visitorType}` }
            });

            console.log(`[EmailService] Sending visitor lead notification to admin: ${visitorAdminEmail}`);
            await this.sendEmail({
                to: visitorAdminEmail,
                subject: `NEW VISITOR LEAD: ${fullName} - ${visitorType}`,
                html: adminHtml,
                profile: 'VISITOR',
                logData: { name: fullName, phone: mobileNo, message: `New visitor registration lead from ${city}.` }
            });

            return true;
        } catch (error) {
            console.error('[EmailService] Error sending visitor registration emails:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
