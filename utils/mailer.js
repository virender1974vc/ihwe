const nodemailer = require('nodemailer');

// Main transporter for fallback
const mainTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Dedicated transporters map
const transporters = {
    DEFAULT: mainTransporter,
    CONTACT: process.env.CONTACT_SMTP_USER ? nodemailer.createTransport({
        host: process.env.CONTACT_SMTP_HOST,
        port: process.env.CONTACT_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.CONTACT_SMTP_USER,
            pass: process.env.CONTACT_SMTP_PASS,
        },
    }) : mainTransporter,
    SPEAKER: process.env.SPEAKER_SMTP_USER ? nodemailer.createTransport({
        host: process.env.SPEAKER_SMTP_HOST,
        port: process.env.SPEAKER_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SPEAKER_SMTP_USER,
            pass: process.env.SPEAKER_SMTP_PASS,
        },
    }) : mainTransporter,
    VISITOR: process.env.VISITOR_SMTP_USER ? nodemailer.createTransport({
        host: process.env.VISITOR_SMTP_HOST,
        port: process.env.VISITOR_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.VISITOR_SMTP_USER,
            pass: process.env.VISITOR_SMTP_PASS,
        },
    }) : mainTransporter,
    EXHIBITOR: process.env.EXHIBITOR_SMTP_USER ? nodemailer.createTransport({
        host: process.env.EXHIBITOR_SMTP_HOST,
        port: process.env.EXHIBITOR_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.EXHIBITOR_SMTP_USER,
            pass: process.env.EXHIBITOR_SMTP_PASS,
        },
    }) : mainTransporter
};

const sendEmail = async (to, subject, html, profile = 'DEFAULT') => {
    try {
        const transporter = transporters[profile] || mainTransporter;
        
        let fromName = process.env.FROM_NAME;
        let fromEmail = process.env.FROM_EMAIL;

        if (profile === 'CONTACT' && process.env.CONTACT_FROM_EMAIL) {
            fromName = process.env.CONTACT_FROM_NAME || fromName;
            fromEmail = process.env.CONTACT_FROM_EMAIL;
        } else if (profile === 'SPEAKER' && process.env.SPEAKER_FROM_EMAIL) {
            fromName = process.env.SPEAKER_FROM_NAME || fromName;
            fromEmail = process.env.SPEAKER_FROM_EMAIL;
        } else if (profile === 'VISITOR' && process.env.VISITOR_FROM_EMAIL) {
            fromName = process.env.VISITOR_FROM_NAME || fromName;
            fromEmail = process.env.VISITOR_FROM_EMAIL;
        } else if (profile === 'EXHIBITOR' && process.env.EXHIBITOR_FROM_EMAIL) {
            fromName = process.env.EXHIBITOR_FROM_NAME || fromName;
            fromEmail = process.env.EXHIBITOR_FROM_EMAIL;
        }

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent via ${profile} profile: %s`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email via ${profile} profile:`, error);
        return { success: false, error };
    }
};

module.exports = { sendEmail };
