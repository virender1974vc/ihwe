'use strict';

const {
    checkItem,
    detailRow,
    escapeHtml
} = require('./visitorAdminTemplateUtils');

const serviceLabels = {
    hotel: 'Hotel Booking',
    travel: 'Travel Assistance',
    stall: 'Stall Design & Fabrication',
    logistics: 'Logistics Support',
    printing: 'Printing & Branding',
    hospitality: 'Hospitality Services'
};

const formatServices = (services) => {
    const values = Array.isArray(services) ? services : [services];
    return values
        .filter(Boolean)
        .map((service) => serviceLabels[String(service).toLowerCase()] || service)
        .join(', ') || 'General Support';
};

const getExpoSupportAdminAlertTemplate = (data) => {
    const name = data.name || data.fullName || 'N/A';
    const company = data.company || data.companyName || 'N/A';
    const phone = data.phone || data.mobile || 'N/A';
    const services = formatServices(data.services || data.selectedServices);
    const message = data.message && data.message !== 'N/A' ? data.message : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Expo Support Enquiry Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f5f8" style="width:100%;border-collapse:collapse;background-color:#f3f5f8;">
        <tr>
            <td align="center" style="padding:16px 8px;">
                <!--[if mso]><table role="presentation" width="800" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:800px;border:1px solid #d8dde6;border-collapse:separate;border-spacing:0;background-color:#ffffff;">
                    <tr>
                        <td style="padding:25px 26px 19px 26px;border-bottom:1px solid #d8dde6;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                                <tr>
                                    <td valign="top" style="padding:0;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0;font-size:20px;line-height:25px;font-weight:800;color:#07162f;text-transform:uppercase;white-space:nowrap;">NEW EXPO SUPPORT ENQUIRY ALERT</div>
                                        <div style="margin-top:8px;font-size:16px;line-height:22px;font-weight:700;color:#59657a;">9th International Health &amp; Wellness Expo 2026 (IHWE &ndash; Global Edition)</div>
                                    </td>
                                    <td width="160" valign="top" align="right" style="width:160px;padding:2px 0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#111827;">This is an automated email.<br><span style="color:#b42318;">Please do not reply.</span></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 26px 17px 26px;">
                            <div style="margin:0 0 15px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:24px;font-weight:700;color:#07162f;">Dear Team,</div>
                            <div style="display:block;width:100%;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#111827;">A new Expo Support Enquiry has been received from <strong>${escapeHtml(company)}</strong>. Please review the requested services and coordinate with the relevant support partners to provide timely assistance.</div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #cfd7e3;border-radius:6px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                                <tr>
                                    <td colspan="2" bgcolor="#0644a6" style="padding:13px 18px;background-color:#0644a6;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#ffffff;text-transform:uppercase;">&#9881;&nbsp;&nbsp; EXPO SUPPORT ENQUIRY DETAILS</td>
                                </tr>
                                ${detailRow('Full Name', name)}
                                ${detailRow('Company Name', company)}
                                ${detailRow('Email ID', data.email, { valueColor: '#0757b7' })}
                                ${detailRow('Mobile Number', phone)}
                                ${detailRow('Requested Service(s)', services, { valueColor: '#0757b7' })}
                            </table>

                            ${message ? `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f9ff" style="width:100%;margin-top:20px;border:1px solid #bed5f4;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f5f9ff;">
                                <tr>
                                    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0 0 9px 0;font-size:16px;line-height:21px;font-weight:800;color:#0644a6;text-transform:uppercase;">&#9998;&nbsp;&nbsp; SUPPORT REQUIREMENT</div>
                                        <div style="font-size:14px;line-height:22px;color:#111827;white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</div>
                                    </td>
                                </tr>
                            </table>` : ''}

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6fbf7" style="width:100%;margin-top:20px;border:1px solid #cfe3d3;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f6fbf7;">
                                <tr>
                                    <td style="padding:14px 18px 8px 18px;">
                                        <div style="padding-bottom:10px;border-bottom:1px solid #d5e5d8;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#08783f;text-transform:uppercase;">&#9745;&nbsp;&nbsp; ACTION REQUIRED</div>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:10px;border-collapse:collapse;">
                                            <tr>
                                                <td width="50%" valign="top" style="width:50%;padding-right:20px;">${checkItem('Review the requested support services')}${checkItem('Assign each request to the relevant partner')}</td>
                                                <td width="50%" valign="top" style="width:50%;padding-left:20px;">${checkItem('Share suitable options and commercial details')}${checkItem('Update follow-up status in IHWE CRM')}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fff9e8" style="width:100%;margin-top:20px;border:1px solid #ead89d;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#fff9e8;">
                                <tr>
                                    <td width="42" valign="top" style="width:42px;padding:16px 0 16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:24px;color:#a66a00;">&#9733;</td>
                                    <td valign="top" style="padding:16px 18px 16px 10px;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0 0 7px 0;font-size:16px;line-height:20px;font-weight:800;color:#946200;text-transform:uppercase;">SERVICE COORDINATION NOTE</div>
                                        <div style="font-size:14px;line-height:21px;color:#111827;">Please connect the enquirer only with verified IHWE support partners and ensure clear communication of scope, pricing and delivery timelines.</div>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top:20px;padding-top:13px;border-top:1px solid #d8dde6;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;">Best Regards,<br><strong style="font-size:16px;color:#0644a6;">Team IHWE 2026</strong><br>Namo Gange Wellness Pvt. Ltd.</div>
                        </td>
                    </tr>
                    <tr><td align="center" style="padding:13px 20px;border-top:1px solid #d8dde6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#667085;">&copy; 2026 IHWE | Global Health Connect. All rights reserved.</td></tr>
                </table>
                <!--[if mso]></td></tr></table><![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`;
};

module.exports = { getExpoSupportAdminAlertTemplate };
