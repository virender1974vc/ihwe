const QRCode = require('qrcode');
const emailServiceInstance = require('./emailService');
const whatsapp = require('./whatsapp');

const PASS_META = {
    exhibitor: { title: 'Exhibitor Pass', detailTitle: 'Exhibitor Details', color: '#c2410c' },
    vehicle: { title: 'Vehicle Pass', detailTitle: 'Vehicle Details', color: '#15803d' },
    service: { title: 'Service Pass', detailTitle: 'Service Personnel Details', color: '#6d28d9' },
    visitor: { title: 'Visitor Pass', detailTitle: 'Visitor Details', color: '#1d4ed8' },
    lunch: { title: 'Lunch Pass', detailTitle: 'Pass Holder Details', color: '#15803d' },
    water: { title: 'Water Bottle Pass', detailTitle: 'Pass Holder Details', color: '#0369a1' }
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const detailRow = (label, value) => `
    <tr>
        <td style="width:125px;padding:7px 10px;color:#64748b;font-size:13px;line-height:18px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:7px 10px;color:#172033;font-size:13px;font-weight:600;line-height:18px;vertical-align:top;">${escapeHtml(value || 'N/A')}</td>
    </tr>
`;

const generatePassHTML = ({ passType, item, cid }) => {
    const meta = PASS_META[passType] || { title: 'IHWE Pass', detailTitle: 'Pass Details', color: '#23471d' };
    const isVehicle = passType === 'vehicle';
    const detailRows = isVehicle
        ? [
            detailRow('Vehicle Number', item.vehicleNumber),
            detailRow('Vehicle Type', item.vehicleType),
            detailRow('Driver / Contact', item.name),
            detailRow('Pass Type', meta.title),
            detailRow('Status', 'Approved')
        ].join('')
        : [
            detailRow('Name', item.name),
            detailRow('Designation', item.designation),
            detailRow('Pass Type', meta.title),
            detailRow('Status', 'Approved')
        ].join('');

    const holderText = isVehicle ? 'registered vehicle' : 'registered pass holder';

    return `
<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(meta.title)} Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f6f4;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f3f6f4;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dfe7e1;border-radius:10px;overflow:hidden;">
                    <tr>
                        <td style="height:5px;background-color:${meta.color};font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="padding:24px 28px 18px;text-align:center;border-bottom:1px solid #edf1ee;">
                            <div style="color:#23471d;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">9th International Health &amp; Wellness Expo 2026</div>
                            <h1 style="margin:8px 0 0;color:#172033;font-size:23px;line-height:30px;font-weight:700;">Your ${escapeHtml(meta.title)} is Approved</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 28px 8px;">
                            <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:24px;">Dear Exhibitor,</p>
                            <p style="margin:0 0 16px;color:#23471d;font-size:15px;line-height:24px;font-weight:700;">Namo Gange Namaskar!</p>
                            <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:24px;">
                                Great news! Your request for <strong style="color:#172033;">1 ${escapeHtml(meta.title)}</strong> has been successfully approved.
                            </p>
                            <p style="margin:0;color:#334155;font-size:15px;line-height:24px;">
                                Your pass is ready for use. Please present the QR code below at the designated entry gate for a smooth and hassle-free check-in.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px 8px;">
                            <h2 style="margin:0 0 10px;color:#172033;font-size:16px;line-height:22px;font-weight:700;">${escapeHtml(meta.detailTitle)}</h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f8faf9;border:1px solid #e3eae5;border-radius:8px;">
                                ${detailRows}
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:20px 28px 8px;">
                            <h2 style="margin:0 0 5px;color:#172033;font-size:16px;line-height:22px;font-weight:700;">Entry QR Code</h2>
                            <p style="margin:0 0 14px;color:#64748b;font-size:12px;line-height:18px;">Scan this QR code at the venue entrance to gain access.</p>
                            <div style="display:inline-block;padding:10px;background-color:#ffffff;border:1px solid #dce5de;border-radius:8px;">
                                <img src="cid:${cid}" width="160" height="160" alt="Entry QR Code" style="display:block;width:160px;height:160px;border:0;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 28px 8px;">
                            <div style="padding:15px 17px;background-color:#f7faf8;border-left:3px solid ${meta.color};border-radius:6px;">
                                <h2 style="margin:0 0 9px;color:#172033;font-size:15px;line-height:21px;font-weight:700;">Important Information</h2>
                                <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:21px;">
                                    <li style="margin-bottom:5px;">Carry a valid government-issued photo ID for verification, if requested.</li>
                                    <li style="margin-bottom:5px;">This QR code is unique and valid for one ${holderText} only.</li>
                                    <li style="margin-bottom:5px;">Do not share this QR code with anyone else.</li>
                                    <li>Please arrive early to avoid queues and ensure a smooth entry experience.</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 28px 24px;">
                            <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:22px;">
                                We look forward to welcoming you to the <strong>9th International Health &amp; Wellness Expo (IHWE) 2026</strong> and hope you have a productive and enriching experience.
                            </p>
                            <p style="margin:0 0 15px;color:#334155;font-size:14px;line-height:22px;">If you need assistance, our support team will be happy to help.</p>
                            <p style="margin:0;color:#334155;font-size:13px;line-height:21px;">
                                <strong>Email:</strong> <a href="mailto:info@ihwe.in" style="color:${meta.color};text-decoration:none;">info@ihwe.in</a><br>
                                <strong>Website:</strong> <a href="https://www.ihwe.in/" style="color:${meta.color};text-decoration:none;">www.ihwe.in</a>
                            </p>
                            <p style="margin:20px 0 0;color:#172033;font-size:14px;line-height:21px;">
                                Warm Regards,<br>
                                <strong>Team IHWE 2026</strong><br>
                                Namo Gange Wellness Pvt. Ltd.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:14px 20px;background-color:#172033;text-align:center;">
                            <p style="margin:0 0 4px;color:#cbd5e1;font-size:10px;line-height:16px;">This is an automated email. Please do not reply to this message.</p>
                            <p style="margin:0;color:#94a3b8;font-size:10px;line-height:16px;">&copy; 2026 IHWE. All Rights Reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const sendPassNotifications = async (passRequest, exhibitorData) => {
    try {
        const type = passRequest.passType;
        const meta = PASS_META[type] || { title: 'IHWE Pass' };
        const exhibitorEmail = exhibitorData.companyEmail || exhibitorData.contact1?.email;
        const exhibitorPhone = exhibitorData.contact1?.mobile || exhibitorData.contact1?.whatsapp;
        const exhibitorName = exhibitorData.exhibitorName || 'Exhibitor';
        const items = type === 'vehicle' ? passRequest.vehicles : passRequest.personnel;

        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const qrData = JSON.stringify({ reqId: passRequest._id.toString(), type, index: i });
                const qrBuffer = await QRCode.toBuffer(qrData, {
                    width: 240,
                    margin: 2,
                    color: { dark: '#172033', light: '#ffffff' }
                });
                const cid = `qrcode_${type}_${i}@ihwe.in`;
                const attachments = [{
                    filename: `${type}-pass-${i + 1}.png`,
                    content: qrBuffer,
                    cid
                }];
                const emailHtml = generatePassHTML({ passType: type, item, cid });
                const subject = `Approved: Your IHWE 2026 ${meta.title}`;
                const targetEmail = item.email || exhibitorEmail;

                if (targetEmail) {
                    await emailServiceInstance.sendEmail({
                        to: targetEmail,
                        subject,
                        html: emailHtml,
                        attachments,
                        profile: 'EXHIBITOR',
                        logData: {
                            name: item.name || exhibitorName,
                            phone: item.phone,
                            message: `Sent ${type} pass QR code`
                        }
                    });
                }

                const targetPhone = item.phone || exhibitorPhone;
                if (targetPhone) {
                    await whatsapp.sendPassApprovalWhatsApp(
                        targetPhone,
                        1,
                        type,
                        targetEmail || 'N/A',
                        item.name || exhibitorName
                    );
                }
            }
        }

        return true;
    } catch (error) {
        console.error('[PassEmailService] Error sending pass notifications:', error);
        return false;
    }
};

module.exports = {
    sendPassNotifications
};
