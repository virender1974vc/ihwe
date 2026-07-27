'use strict';

const {
    checkItem,
    detailRow,
    escapeHtml,
    formatList,
    getRegistrationTimestamp
} = require('./visitorAdminTemplateUtils');

const getGeneralVisitorAdminAlertTemplate = (data) => {
    const timestamp = getRegistrationTimestamp(data);
    const visitorName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'N/A';
    const email = data.email || data.emailAddress || 'N/A';
    const mobile = data.mobile || data.mobileNo || data.phone || 'N/A';

    return `<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New General Visitor Registration Alert</title>
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
                                        <div style="margin:0;font-size:19px;line-height:25px;font-weight:800;color:#07162f;text-transform:uppercase;white-space:nowrap;">NEW GENERAL VISITOR REGISTRATION ALERT</div>
                                        <div style="margin-top:8px;font-size:16px;line-height:22px;font-weight:700;color:#59657a;">9th International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</div>
                                    </td>
                                    <td width="160" valign="top" align="right" style="width:160px;padding:2px 0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#111827;">
                                        This is an automated email.<br><span style="color:#b42318;">Please do not reply.</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 26px 17px 26px;">
                            <div style="margin:0 0 15px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:24px;font-weight:700;color:#07162f;">Dear Team,</div>
                            <div style="margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#111827;">
                                This is to inform you that a new General Visitor has successfully registered for<br>
                                <strong>9th International Health &amp; Wellness Expo 2026 (IHWE – Global Edition).</strong><br>
                                Please find the registration details below for your reference and necessary follow-up.
                            </div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #cfd7e3;border-radius:6px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                                <tr>
                                    <td colspan="2" bgcolor="#0644a6" style="padding:13px 18px;background-color:#0644a6;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#ffffff;text-transform:uppercase;">
                                        <span style="font-size:22px;line-height:22px;vertical-align:-2px;">&#8853;</span>&nbsp;&nbsp; GENERAL VISITOR DETAILS
                                    </td>
                                </tr>
                                ${detailRow('Registration ID', data.registrationId)}
                                ${detailRow('Registration Date', timestamp.date)}
                                ${detailRow('Registration Time', timestamp.time)}
                                ${detailRow('Visitor Name', visitorName)}
                                ${detailRow('Visitor Category', data.visitorType || 'General Visitor', { valueColor: '#0757b7' })}
                                ${detailRow('Email ID', email, { valueColor: '#0757b7' })}
                                ${detailRow('Mobile Number', mobile)}
                                ${detailRow('City', data.city)}
                                ${detailRow('Interested Segments', formatList(data.areaOfInterest))}
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6fbf7" style="width:100%;margin-top:20px;border:1px solid #cfe3d3;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f6fbf7;">
                                <tr>
                                    <td style="padding:14px 18px 8px 18px;">
                                        <div style="padding-bottom:10px;border-bottom:1px solid #d5e5d8;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#08783f;text-transform:uppercase;">&#9745;&nbsp;&nbsp; ACTION REQUIRED</div>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:10px;border-collapse:collapse;">
                                            <tr>
                                                <td width="50%" valign="top" style="width:50%;padding-right:20px;">
                                                    ${checkItem('Verify the registration details')}
                                                    ${checkItem('Ensure confirmation email & QR code has been sent')}
                                                </td>
                                                <td width="50%" valign="top" style="width:50%;padding-left:20px;">
                                                    ${checkItem('Update the central registration database')}
                                                    ${checkItem('No follow-up required (General Visitor)')}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f9ff" style="width:100%;margin-top:20px;border:1px solid #bed5f4;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f5f9ff;">
                                <tr>
                                    <td width="42" valign="top" style="width:42px;padding:16px 0 16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:24px;font-weight:800;color:#0757b7;">&#9432;</td>
                                    <td valign="top" style="padding:16px 18px 16px 10px;font-family:Arial,Helvetica,sans-serif;">
                                        <div style="margin:0 0 8px 0;font-size:16px;line-height:20px;font-weight:800;color:#0644a6;text-transform:uppercase;">NOTE</div>
                                        <div style="font-size:14px;line-height:21px;color:#111827;">This is a General Visitor registration. Confirmation email with QR code has been triggered automatically.<br>Kindly ensure database is updated.</div>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:20px;border:1px dotted #aeb6c2;border-collapse:separate;border-spacing:0;">
                                <tr>
                                    <td width="50%" valign="middle" style="width:50%;padding:14px 20px;border-right:1px solid #cfd5df;font-family:Arial,Helvetica,sans-serif;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td width="45" valign="middle" style="width:45px;font-size:25px;line-height:25px;color:#07162f;">&#9993;</td>
                                                <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:#07162f;"><strong>For more details, log in to IHWE CRM</strong><br>and check the Visitors Module.</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="50%" valign="middle" style="width:50%;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td width="45" valign="middle" style="width:45px;font-size:25px;line-height:25px;color:#0757b7;">&#9823;</td>
                                                <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:#07162f;"><strong>Team IHWE 2026</strong><br>Let's work together for a successful event!</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;">
                                Best Regards,<br>
                                <strong style="font-size:16px;color:#0644a6;">Team IHWE 2026</strong><br>
                                Namo Gange Wellness Pvt. Ltd.
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:13px 20px;border-top:1px solid #d8dde6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#667085;">&copy; 2026 IHWE | Global Health Connect. All rights reserved.</td>
                    </tr>
                </table>
                <!--[if mso]></td></tr></table><![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`;
};

module.exports = { getGeneralVisitorAdminAlertTemplate };
