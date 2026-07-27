'use strict';

const {
    checkItem,
    detailRow,
    escapeHtml,
    formatList,
    getRegistrationTimestamp
} = require('./visitorAdminTemplateUtils');

const hasValue = (value) => Array.isArray(value) ? value.filter(Boolean).length > 0 : value !== null && value !== undefined && value !== '';
const optionalRow = (label, value, options) => hasValue(value) ? detailRow(label, Array.isArray(value) ? formatList(value) : value, options) : '';

const section = (title, rows) => rows ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:18px;border:1px solid #cfd7e3;border-radius:6px;border-collapse:separate;border-spacing:0;overflow:hidden;">
        <tr>
            <td colspan="2" bgcolor="#0644a6" style="padding:12px 18px;background-color:#0644a6;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:800;color:#ffffff;text-transform:uppercase;">${escapeHtml(title)}</td>
        </tr>
        ${rows}
    </table>` : '';

const getSellerRegistrationAdminAlertTemplate = (data) => {
    const timestamp = getRegistrationTimestamp(data);
    const sellerName = data.fullName || data.companyName || 'N/A';

    const registrationRows =
        detailRow('Registration ID', data.registrationId) +
        detailRow('Registration Date', timestamp.date) +
        detailRow('Registration Time', timestamp.time) +
        optionalRow('Registration Category', data.registrationCategory, { valueColor: '#0757b7' }) +
        optionalRow('Registration Fee', data.registrationFee ? `₹${data.registrationFee}` : '') +
        optionalRow('Payment Mode', data.paymentMode) +
        optionalRow('Payment Status', data.paymentStatus, { valueColor: data.paymentStatus === 'Completed' ? '#08783f' : '#a66a00' }) +
        optionalRow('Transaction ID', data.transactionId) +
        optionalRow('Seller Priority', data.sellerTag);

    const contactRows =
        detailRow('Full Name', sellerName) +
        optionalRow('Designation', data.designation) +
        detailRow('Company Name', data.companyName) +
        detailRow('Email ID', data.emailAddress, { valueColor: '#0757b7' }) +
        detailRow('Mobile Number', data.mobileNumber) +
        optionalRow('Alternate Number', data.alternateNumber) +
        optionalRow('Website', data.website, { valueColor: '#0757b7' }) +
        optionalRow('Registered Address', data.registeredAddress) +
        optionalRow('City', data.city) +
        optionalRow('State / Province', data.stateProvince) +
        optionalRow('Country', data.country) +
        optionalRow('PIN Code', data.pinCode);

    const businessRows =
        optionalRow('Business Type', data.businessType) +
        optionalRow('Company / Firm Type', data.companyFirmName) +
        optionalRow('Business Classification', data.basicBusinessType) +
        optionalRow('Year of Establishment', data.yearOfEstablishment) +
        optionalRow('Nature of Business', data.natureOfBusiness) +
        optionalRow('Years in Business', data.yearsInBusiness) +
        optionalRow('Number of Outlets', data.numberOfOutlets) +
        optionalRow('Annual Turnover', data.annualTurnover) +
        optionalRow('GST Number', data.gstNumber) +
        optionalRow('PAN Number', data.panNumber);

    const productRows =
        optionalRow('Primary Product Category', data.primaryProductCategory, { valueColor: '#0757b7' }) +
        optionalRow('Secondary Categories', data.secondaryProductCategories) +
        optionalRow('Specific Product Details', data.specificProductDetails) +
        optionalRow('Production Capacity', data.productionCapacity) +
        optionalRow('Target Market', data.targetMarket) +
        optionalRow('Preferred Buyer Type', data.preferredBuyerType) +
        optionalRow('Preferred Buyer Region', data.preferredBuyerRegion) +
        optionalRow('Selling Frequency', data.sellingFrequency) +
        optionalRow('Estimated Annual Sale Value', data.estimatedAnnualSaleValue) +
        optionalRow('Certifications', data.certifications);

    const meetingRows =
        optionalRow('Matchmaking Interest', data.matchmakingInterest) +
        optionalRow('Preferred Meeting Date', data.preferredMeetingDate) +
        optionalRow('Preferred Time Slot', data.preferredTimeSlot) +
        optionalRow('Pre-Scheduled B2B Required', data.requirePreScheduledB2B) +
        optionalRow('Meeting Priority Level', data.meetingPriorityLevel, { valueColor: '#0757b7' });

    return `<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Seller Registration Alert</title>
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
                                        <div style="margin:0;font-size:20px;line-height:25px;font-weight:800;color:#07162f;text-transform:uppercase;white-space:nowrap;">NEW SELLER REGISTRATION ALERT</div>
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
                            <div style="display:block;width:100%;margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#111827;">A new Seller Registration has been received from <strong>${escapeHtml(data.companyName)}</strong> for IHWE 2026. Please review the seller profile and coordinate the required B2B matchmaking and registration follow-up.</div>

                            ${section('Registration & Payment Details', registrationRows)}
                            ${section('Contact Information', contactRows)}
                            ${section('Business Profile', businessRows)}
                            ${section('Selling & Product Details', productRows)}
                            ${section('B2B Meeting Preferences', meetingRows)}

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6fbf7" style="width:100%;margin-top:20px;border:1px solid #cfe3d3;border-radius:6px;border-collapse:separate;border-spacing:0;background-color:#f6fbf7;">
                                <tr>
                                    <td style="padding:14px 18px 8px 18px;">
                                        <div style="padding-bottom:10px;border-bottom:1px solid #d5e5d8;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:22px;font-weight:800;color:#08783f;text-transform:uppercase;">&#9745;&nbsp;&nbsp; ACTION REQUIRED</div>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:10px;border-collapse:collapse;">
                                            <tr>
                                                <td width="50%" valign="top" style="width:50%;padding-right:20px;">${checkItem('Verify seller and payment details')}${checkItem('Review product categories and capacity')}</td>
                                                <td width="50%" valign="top" style="width:50%;padding-left:20px;">${checkItem('Assign relevant buyer matchmaking')}${checkItem('Update seller status in IHWE CRM')}</td>
                                            </tr>
                                        </table>
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

module.exports = { getSellerRegistrationAdminAlertTemplate };
