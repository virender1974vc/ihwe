const nodemailer = require('nodemailer');
const fs = require('fs');
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendEmail({ to, subject, html, attachments = [] }) {
        try {
            const mailOptions = {
                from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
                to,
                subject,
                html,
                attachments: attachments.map(item => ({
                    filename: item.filename,
                    path: item.path
                })),
            };

            const info = await this.transporter.sendMail(mailOptions);
            attachments.forEach(item => {
                if (fs.existsSync(item.path)) {
                    fs.unlinkSync(item.path);
                }
            });

            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
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
            attachments: [{ filename: `Registration_Form_${registration.exhibitorName}.pdf`, path: pdfPath }]
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
            attachments: [{ filename: `Payment_Receipt_${registration.exhibitorName}.pdf`, path: pdfPath }]
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
            html
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
            html
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
            html
        });
    }
}
module.exports = new EmailService();
