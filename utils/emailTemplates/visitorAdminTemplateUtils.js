'use strict';

const escapeHtml = (value, fallback = 'N/A') => {
    const normalized = value === null || value === undefined || value === '' ? fallback : String(value);
    return normalized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const formatList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || 'N/A';
    return value || 'N/A';
};

const getRegistrationTimestamp = (data) => {
    const timestamp = data.registrationDate || data.createdAt || data.registeredAt;
    const date = timestamp ? new Date(timestamp) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

    return {
        date: safeDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        }),
        time: safeDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        })
    };
};

const detailRow = (label, value, options = {}) => {
    const valueColor = options.valueColor || '#101828';
    return `
        <tr>
            <td width="35%" valign="middle" style="width:35%;padding:10px 18px;border-right:1px solid #d8dee8;border-bottom:1px solid #d8dee8;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;color:#111827;">
                ${escapeHtml(label)}
            </td>
            <td width="65%" valign="middle" style="width:65%;padding:10px 20px;border-bottom:1px solid #d8dee8;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:400;color:${valueColor};word-break:break-word;">
                ${escapeHtml(value)}
            </td>
        </tr>`;
};

const checkItem = (text) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
            <td width="28" valign="top" style="width:28px;padding:1px 8px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:20px;color:#08783f;">&#10003;</td>
            <td valign="top" style="padding:0 0 8px 0;border-bottom:1px dotted #cbd8cf;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${escapeHtml(text)}</td>
        </tr>
    </table>`;

module.exports = {
    checkItem,
    detailRow,
    escapeHtml,
    formatList,
    getRegistrationTimestamp
};
