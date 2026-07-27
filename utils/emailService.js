const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const { emailShell } = require('./emailTemplates/emailShell');
const { adminLeadShell } = require('./emailTemplates/adminLeadShell');
const templateEngineMethods = require('./emailComponents/templateEngine');
const visitorEmailMethods = require('./emailComponents/visitorEmails');
const exhibitorEmailMethods = require('./emailComponents/exhibitorEmails');
const accessoryRegistrationMethods = require('./emailComponents/accessoryRegistration');
const sendB2BMeetingNotificationHandler = require('./emailHandlers/b2bMeetingNotification');
const sendSponsorshipConfirmationHandler = require('./emailHandlers/sponsorshipConfirmation');
const sendExpoSupportConfirmationHandler = require('./emailHandlers/expoSupportConfirmation');
const sendOtpEmailHandler = require('./emailHandlers/otpEmail');
const sendAccessoryOrderEmailHandler = require('./emailHandlers/accessoryOrderEmail');
const sendPaymentDelayWarningHandler = require('./emailHandlers/paymentDelayWarning');
const sendInstallmentReminderHandler = require('./emailHandlers/installmentReminder');
const sendManualPaymentReceiptHandler = require('./emailHandlers/manualPaymentReceipt');

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

        this.emailShell = emailShell;
        this.adminLeadShell = adminLeadShell;
    }

    async sendEmail({ to, subject, html, attachments = [], profile = 'DEFAULT', logData = {} }) {
        const recipient = String(to || '').trim();
        if (!recipient) {
            console.warn(`[Email] Skipped "${subject || 'Untitled'}": no recipient email available.`);
            return false;
        }

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
            fromEmail = fromEmail || process.env.SMTP_USER || 'no-reply@ihwe.in';
            fromName = fromName || 'IHWE Team';

            const info = await transporter.sendMail({
                from: '"' + fromName + '" <' + fromEmail + '>',
                to: recipient,
                subject,
                html,
                attachments
            });

            console.log('[Email] Sent:', {
                to,
                subject,
                profile,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response
            });


            await EmailLog.create({
                recipient,
                subject,
                status: 'success',
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null,
                senderId: logData.senderId || null,
                senderName: logData.senderName || null,
                companyId: logData.companyId || null,
                companyName: logData.companyName || null
            }).catch(err => console.error("EmailLog (success) failed:", err.message));

            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            await EmailLog.create({
                recipient,
                subject,
                status: 'failed',
                error: error.message,
                name: logData.name || null,
                phone: logData.phone || null,
                message: logData.message || null,
                senderId: logData.senderId || null,
                senderName: logData.senderName || null,
                companyId: logData.companyId || null,
                companyName: logData.companyName || null
            }).catch(err => console.error("EmailLog (failed) failed:", err.message));
            return false;
        }
    }

}

Object.assign(
    EmailService.prototype,
    templateEngineMethods,
    visitorEmailMethods,
    exhibitorEmailMethods,
    accessoryRegistrationMethods,
    {
        sendB2BMeetingNotification: sendB2BMeetingNotificationHandler,
        sendSponsorshipConfirmation: sendSponsorshipConfirmationHandler,
        sendExpoSupportConfirmation: sendExpoSupportConfirmationHandler,
        sendOtpEmail: sendOtpEmailHandler,
        sendAccessoryOrderEmail: sendAccessoryOrderEmailHandler,
        sendPaymentDelayWarning: sendPaymentDelayWarningHandler,
        sendInstallmentReminder: sendInstallmentReminderHandler,
        sendManualPaymentReceipt: sendManualPaymentReceiptHandler
    }
);

module.exports = new EmailService();
