'use strict';
const fs = require('fs');
const QRCode = require('qrcode');
const whatsapp = require('../whatsapp');
const { getBuyerInterestAlertTemplate } = require('../emailTemplates/buyerInterestAlert');
const { getExhibitorAdminAlertTemplate } = require('../emailTemplates/exhibitorAdminAlert');
const { getBuyerRegistrationAlertTemplate } = require('../emailTemplates/buyerRegistrationAlert');
const { getInternationalBuyerRegistrationAlertTemplate } = require('../emailTemplates/internationalBuyerRegistrationAlert');
const { getCorporateVisitorAdminAlertTemplate } = require('../emailTemplates/corporateVisitorAdminAlert');
const { getGeneralVisitorAdminAlertTemplate } = require('../emailTemplates/generalVisitorAdminAlert');

async function sendVisitorRegistrationEmails(data, whatsappOnly = false) {
    const type = data.visitorType.toLowerCase().includes('corporate') ? 'corporate-visitor' :
        data.visitorType.toLowerCase().includes('health') ? 'health-camp-visitor' : 'general-visitor';

    const isHealthCamp = type === 'health-camp-visitor';
    const userResult = await this.sendDynamicConfirmation({
        to: data.email,
        formType: type,
        data: {
            ...data,
            name: `${data.firstName} ${data.lastName || ''}`.trim(),
        },
        profile: 'VISITOR',
        notifyAdmin: !isHealthCamp && !data.isResend && !whatsappOnly,
        whatsappOnly
    });

    if (isHealthCamp && !data.isResend) {
        await this.sendHealthCampAdminNotification(data);
    }

    return userResult;
}

async function sendVisitorConfirmationOnly(data, formType, whatsappOnly = false) {
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

        const getImageBuffer = (imgPath) => {
            try {
                if (!imgPath) return null;
                const absPath = require('path').resolve(__dirname, '..', '..', imgPath.replace(/^\//, ''));
                if (!fs.existsSync(absPath)) return null;
                return fs.readFileSync(absPath);
            } catch (e) { return null; }
        };
        const headerBuf = getImageBuffer(template.headerImage);
        const footerBuf = getImageBuffer(template.footerImage);
        const smallLogoBuf = getImageBuffer(template.smallLogo);


        if (template.smallLogo && smallLogoBuf) {
            const smallLogoHtml = `<div style="text-align: left; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;"><img src="cid:email_small_logo_img@ihwe.in" alt="Logo" width="150" style="display:block; max-width:150px; height:auto; border:0;" /></div>`;
            bodyContent += smallLogoHtml;
        }

        if ((formType === 'corporate-visitor' || formType === 'international-visitor' || formType === 'general-visitor' || formType === 'buyer-registration' || formType === 'health-camp-visitor') && data.registrationId) {
            try {
                const frontendUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
                const scanPath = formType === 'buyer-registration' ? 'buyer-scan' : 'visitor';
                const scanUrl = `${frontendUrl}/${scanPath}?id=${encodeURIComponent(data.registrationId)}`;
                const qrBuffer = await QRCode.toBuffer(scanUrl, { width: 150, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                const qrBlock = `
                        <div style="text-align: center; margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                            <p style="font-weight:700;color:#23471d;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Scan QR Code for Entry</p>
                            <img src="cid:qrcode_entry@ihwe.in" alt="Entry QR Code" width="120" height="120" style="border:4px solid #23471d;border-radius:8px;display:inline-block;" />
                            <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">Registration ID: <strong>${data.registrationId}</strong></p>
                            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Present this QR code at the entrance for hassle-free access.</p>
                        </div>`;
                bodyContent = bodyContent.includes(QR_TOKEN) ? bodyContent.replace(QR_TOKEN, qrBlock) : bodyContent + qrBlock;
                emailAttachments.push({ filename: 'entry-qr.png', content: qrBuffer, cid: 'qrcode_entry@ihwe.in' });
            } catch (qrErr) {
                console.error('[QR] Failed to generate QR code:', qrErr.message);
                bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
            }
        } else {
            bodyContent = bodyContent.replace(new RegExp(QR_TOKEN, 'g'), '');
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

        const html = this.emailShell(bodyContent, {
            headerCid: headerBuf ? 'email_header_img@ihwe.in' : null,
            footerCid: footerBuf ? 'email_footer_img@ihwe.in' : null,
            smallLogoCid: smallLogoBuf ? 'email_small_logo_img@ihwe.in' : null,
            headerImage: template.headerImage || null,
            footerImage: template.footerImage || null,
            smallLogoImage: template.smallLogo || null,
        });

        const whatsappContent = this.applyPlaceholders(template.whatsappBody, data);

        let sentToUser = false;
        if (!whatsappOnly) {
            sentToUser = await this.sendEmail({
                to: data.emailAddress || data.email,
                subject,
                html,
                attachments: emailAttachments,
                profile: 'VISITOR',
                logData: { name: data.fullName || data.firstName || data.name, phone: data.mobileNumber || data.mobile || data.phone, message: `Visitor Confirmation (${formType})` }
            });
        } else {
            sentToUser = true; // Pretend we sent it so the UI doesn't show error if we only wanted whatsapp
        }


        const mobile = data.mobile || data.phone || data.whatsapp || data.mobileNumber;
        if (mobile && whatsappContent) {
            this.trySendAisensyForFormType(formType, mobile, template, data).then(result => {
                if (!result.success) {
                    return whatsapp.sendWhatsAppMessage(mobile, whatsappContent, `Visitor: ${formType}`);
                }
            }).catch(err => {
                console.error(`[WhatsApp] Failed to send msg for ${formType}:`, err.message);
            });
        }

        return sentToUser;
    } catch (error) {
        console.error('Error sending visitor confirmation for ' + formType + ':', error);
        return false;
    }
}

async function sendExhibitorAdminAlert(registration) {
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

async function sendDetailedVisitorNotification(data, recipientType = 'admin') {
    try {
        let subject, html;
        let recipientEmail;
        let logMessage;

        if (recipientType === 'b2b') {

            subject = `Buyer Registration Interest Received | IHWE 2026 | Reg ID: ${data.registrationId}`;
            html = getBuyerInterestAlertTemplate(data);
            recipientEmail = process.env.B2B_COORDINATOR_EMAIL || 'vansh.2002cv@gmail.com';
            logMessage = 'B2B Coordinator Notification';
        } else {

            const isCorporateVisitor = String(data.visitorType || '').toLowerCase().includes('corporate');
            const isInternationalVisitor = String(data.visitorType || '').toLowerCase().includes('international');
            // Website (public) registrations never send created_by; admin-panel-entered
            // registrations always do (see generalVisitorSlice.js etc.).
            const registrationSource = data.created_by ? 'Portal' : 'Web';

            if (isInternationalVisitor) {
                subject = `${registrationSource} | NEW INTERNATIONAL VISITOR REGISTRATION ALERT | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getCorporateVisitorAdminAlertTemplate(data);
            } else if (isCorporateVisitor) {
                subject = `${registrationSource} | NEW CORPORATE VISITOR REGISTRATION ALERT | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getCorporateVisitorAdminAlertTemplate(data);
            } else {
                subject = `${registrationSource} | NEW GENERAL VISITOR REGISTRATION ALERT | IHWE 2026 | Reg ID: ${data.registrationId}`;
                html = getGeneralVisitorAdminAlertTemplate(data);
            }
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

async function sendDetailedBuyerNotification(data) {
    try {
        const subject = `NEW BUYER REGISTRATION | IHWE 2026 | Reg ID: ${data.registrationId}`;
        const html = getBuyerRegistrationAlertTemplate(data);
        const recipientEmail = process.env.BUYER_ADMIN_EMAIL || process.env.VISITOR_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'virender.1974vc@gmail.com';

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

async function sendDetailedInternationalBuyerNotification(data) {
    try {
        const subject = `NEW INTL BUYER REGISTRATION | IHWE 2026 | Reg ID: ${data.registrationId}`;
        const html = getInternationalBuyerRegistrationAlertTemplate(data);
        const recipientEmail = process.env.INTERNATIONAL_BUYER_ADMIN_EMAIL || process.env.VISITOR_ADMIN_EMAIL || 'virender.1974vc@gmail.com';

        await this.sendEmail({
            to: recipientEmail,
            subject,
            html,
            profile: 'DEFAULT',
            logData: {
                name: data.brandName,
                phone: data.primaryContact?.mobileNumber,
                message: 'Admin International Buyer Alert'
            }
        });

        console.log(`[AdminIntlBuyerAlert] Sent to ${recipientEmail} for ${data.registrationId}`);
        return true;
    } catch (error) {
        console.error('Error sending detailed international buyer notification:', error);
        return false;
    }
}

async function sendInternationalBuyerRegistrationEmails(data) {
    return await this.sendDynamicConfirmation({
        to: data.primaryContact?.emailId,
        formType: 'buyer-registration',
        data: {
            name: data.primaryContact?.fullName,
            company: data.brandName,
            email: data.primaryContact?.emailId,
            phone: data.primaryContact?.mobileNumber,
            city: data.city,
            country: data.country,
            registrationId: data.registrationId
        },
        profile: 'DEFAULT',
        notifyAdmin: false
    });
}

async function sendBuyerRegistrationEmails(data) {
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

module.exports = { sendVisitorRegistrationEmails, sendVisitorConfirmationOnly, sendExhibitorAdminAlert, sendDetailedVisitorNotification, sendDetailedBuyerNotification, sendDetailedInternationalBuyerNotification, sendInternationalBuyerRegistrationEmails, sendBuyerRegistrationEmails };
