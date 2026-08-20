'use strict';
/**
 * Microsoft Graph mail sender (Mail.Send, application permission).
 * Isolated from emailService.js so the SMTP path can be restored by
 * flipping MS_GRAPH_VISITOR_EMAIL_ENABLED without touching this file.
 */
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

let graphClient = null;

function getGraphClient() {
    if (graphClient) return graphClient;

    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Microsoft Graph credentials (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET) are not configured.');
    }

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
    });

    graphClient = Client.initWithMiddleware({ authProvider });
    return graphClient;
}

// nodemailer-style {filename, content: Buffer, cid} -> Graph fileAttachment
function toGraphAttachments(attachments = []) {
    return attachments.map(att => {
        const contentBytes = Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : Buffer.from(att.content || '', att.encoding || 'utf8').toString('base64');

        const attachment = {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.filename,
            contentType: att.contentType || 'application/octet-stream',
            contentBytes,
        };

        if (att.cid) {
            attachment.contentId = att.cid;
            attachment.isInline = true;
        }

        return attachment;
    });
}

/**
 * Sends an email through Microsoft Graph using the configured M365 sender mailbox.
 * Mirrors the shape nodemailer's transporter.sendMail() is called with in emailService.js.
 */
async function sendMailViaGraph({ to, subject, html, attachments = [] }) {
    const senderEmail = process.env.MS_SENDER_EMAIL;
    if (!senderEmail) {
        throw new Error('MS_SENDER_EMAIL is not configured.');
    }

    const client = getGraphClient();

    const message = {
        subject,
        body: {
            contentType: 'HTML',
            content: html,
        },
        toRecipients: [{ emailAddress: { address: to } }],
        attachments: toGraphAttachments(attachments),
    };

    await client.api(`/users/${encodeURIComponent(senderEmail)}/sendMail`).post({
        message,
        saveToSentItems: false,
    });

    return true;
}

module.exports = { sendMailViaGraph };
