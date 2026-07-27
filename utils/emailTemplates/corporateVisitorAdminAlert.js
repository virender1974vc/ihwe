'use strict';

const {
    checkItem,
    detailRow,
    escapeHtml,
    formatList,
    getRegistrationTimestamp
} = require('./visitorAdminTemplateUtils');

const getCorporateVisitorAdminAlertTemplate = (data) => {
    const timestamp = getRegistrationTimestamp(data);
    const visitorName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'N/A';
    const email = data.email || data.emailAddress || 'N/A';
    const mobile = data.mobile || data.mobileNo || data.phone || 'N/A';

    return `<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Corporate Visitor Registration Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f5f8" style="width:100%;border-collapse:collapse;background-color:#f3f5f8;">
        <tr>
            <td align="center" style="padding:16px 8px;">
                <!--[if mso]><table role="presentation" width="800" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:800px;border:1px solid #d8dde6;border-collapse:separate;border-spacing:0;background-color:#ffffff;">
                    <tr>
                        <td style="padding:25px 32px 19px 32px;border-bottom:1px solid #d8dde6;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                                <tr>
                                    <td valign="top" style="padding:0;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0;font-size:19px;line-height:25px;font-weight:800;color:#07162f;text-transform:uppercase;white-space:nowrap;">NEW CORPORATE VISITOR REGISTRATION ALERT</div>
                                        <div style="margin-top:8px;font-size:16px;line-height:22px;font-weight:700;color:#59657a;">9th International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</div>
                                    </td>
                                    <td width="175" valign="top" align="right" style="width:175px;padding:2px 0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#111827;">
                                        This is an automated email.<br>Please do not reply.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:23px 32px 25px 32px;">
                            <div style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:24px;font-weight:700;color:#07162f;">Dear Team,</div>
                            <div style="margin:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#111827;">
                                This is to inform you that a new Corporate Visitor has successfully registered for<br>
                                <strong>9th International Health &amp; Wellness Expo 2026 (IHWE – Global Edition).</strong><br>
                                Please find the registration details below for your reference and necessary follow-up.
                            </div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #cfd7e3;border-radius:6px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                                <tr>
                                    <td colspan="2" bgcolor="#0644a6" style="padding:13px 18px;background-color:#0644a6;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#ffffff;text-transform:uppercase;">
                                        <span style="font-size:22px;line-height:22px;vertical-align:-2px;">&#8853;</span>&nbsp;&nbsp; CORPORATE VISITOR DETAILS
                                    </td>
                                </tr>
                                ${detailRow('Registration ID', data.registrationId)}
                                ${detailRow('Registration Date', timestamp.date)}
                                ${detailRow('Registration Time', timestamp.time)}
                                ${detailRow('Visitor Name', visitorName)}
                                ${detailRow('Visitor Category', data.visitorType || 'Corporate Visitor', { valueColor: '#0757b7' })}
                                ${detailRow('Company Name', data.companyName)}
                                ${detailRow('Designation', data.designation)}
                                ${detailRow('Email ID', email, { valueColor: '#0757b7' })}
                                ${detailRow('Mobile Number', mobile)}
                                ${detailRow('City', data.city)}
                                ${detailRow('Interested Segments', formatList(data.areaOfInterest))}
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6fbf7" style="width:100%;margin-top:20px;border:1px solid #cfe3d3;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f6fbf7;">
                                <tr>
                                    <td style="padding:16px 18px 8px 18px;">
                                        <div style="padding-bottom:10px;border-bottom:1px solid #d5e5d8;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#08783f;text-transform:uppercase;">&#9745;&nbsp;&nbsp; ACTION REQUIRED</div>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:10px;border-collapse:collapse;">
                                            <tr>
                                                <td width="50%" valign="top" style="width:50%;padding-right:20px;">
                                                    ${checkItem('Verify the registration details')}
                                                    ${checkItem('Ensure confirmation email & QR code has been sent')}
                                                    ${checkItem('Update the central registration database')}
                                                </td>
                                                <td width="50%" valign="top" style="width:50%;padding-left:20px;">
                                                    ${checkItem('Assign follow-up (If Corporate Visitor / Buyer)')}
                                                    ${checkItem('Connect with visitor for networking & participation opportunities')}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffaf0" style="width:100%;margin-top:20px;border:1px solid #f0dda4;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#fffaf0;">
                                <tr>
                                    <td width="38" valign="top" style="width:38px;padding:16px 0 16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:24px;color:#f4b400;">&#9733;</td>
                                    <td valign="top" style="padding:16px 18px 16px 10px;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0 0 8px 0;font-size:16px;line-height:20px;font-weight:800;color:#9a6900;text-transform:uppercase;">IMPORTANT NOTE</div>
                                        <div style="font-size:14px;line-height:21px;color:#111827;">This is a Corporate Visitor. Please give priority follow-up and explore business networking,<br>partnership, sponsorship or exhibitor participation opportunities.</div>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top:18px;padding-top:10px;border-top:1px solid #d8dde6;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;">
                                Best Regards,<br>
                                <strong style="font-size:16px;color:#07162f;">Team IHWE 2026</strong><br>
                                Namo Gange Wellness Pvt. Ltd.
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:15px 20px;border-top:1px solid #d8dde6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#667085;">&copy; 2026 IHWE | Global Health Connect. All rights reserved.</td>
                    </tr>
                </table>
                <!--[if mso]></td></tr></table><![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`;
};

module.exports = { getCorporateVisitorAdminAlertTemplate };
