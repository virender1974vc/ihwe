// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const MessageTemplate = require('../models/MessageTemplate');

// function emailShell(body = '', options = {}) {
//     const maxWidth = Number(options.maxWidth || 1024);
//     const padding = options.padding === undefined || options.padding === null
//         ? 0
//         : Number(options.padding);

//     const headerSrc = options.headerCid
//         ? `cid:${options.headerCid}`
//         : (/^https?:\/\//i.test(String(options.headerImage || '')) ? options.headerImage : null);

//     const footerSrc = options.footerCid
//         ? `cid:${options.footerCid}`
//         : (/^https?:\/\//i.test(String(options.footerImage || '')) ? options.footerImage : null);

//     const headerHtml = headerSrc
//         ? `<tr>
//                 <td style="padding:0;margin:0;line-height:0;font-size:0;background:#ffffff;">
//                     <img src="${headerSrc}" alt="IHWE 2026"
//                         width="${maxWidth}"
//                         style="display:block;width:100%;max-width:${maxWidth}px;height:auto;margin:0;padding:0;border:0;outline:none;text-decoration:none;" />
//                 </td>
//            </tr>`
//         : '';

//     const footerHtml = footerSrc
//         ? `<tr>
//                 <td style="padding:0;margin:0;line-height:0;font-size:0;background:#ffffff;">
//                     <img src="${footerSrc}" alt="Namo Gange Wellness"
//                         width="${maxWidth}"
//                         style="display:block;width:100%;max-width:${maxWidth}px;height:auto;margin:0;padding:0;border:0;outline:none;text-decoration:none;" />
//                 </td>
//            </tr>`
//         : (!options.hideFallbackFooter
//             ? `<tr>
//                     <td style="padding:12px 18px;background:#0d2f78;color:#ffffff;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.35;">
//                         Namo Gange Wellness Pvt. Ltd. &nbsp; | &nbsp; IHWE 2026
//                     </td>
//                </tr>`
//             : '');

//     return `<!doctype html>
// <html>
// <head>
//     <meta charset="utf-8">
//     <meta name="viewport" content="width=device-width,initial-scale=1">
//     <meta name="x-apple-disable-message-reformatting">
//     <title>IHWE 2026</title>
//     <style>
//         html,body{margin:0!important;padding:0!important;width:100%!important;background:#f4f6fb!important;}
//         table{border-spacing:0!important;}
//         img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
//         a{text-decoration:none;}
//         @media only screen and (max-width:700px){
//             .email-frame{width:100%!important;max-width:100%!important;}
//         }
//     </style>
// </head>
// <body style="margin:0;padding:0;background:#f4f6fb;">
//     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//         style="width:100%;margin:0;padding:0;background:#f4f6fb;border-collapse:collapse;">
//         <tr>
//             <td align="center" style="padding:0;">
//                 <table role="presentation" width="${maxWidth}" cellspacing="0" cellpadding="0" border="0"
//                     class="email-frame"
//                     style="width:100%;max-width:${maxWidth}px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d6ddeb;">
//                     ${headerHtml}
//                     <tr>
//                         <td style="padding:${padding}px;background:#ffffff;">
//                             ${body}
//                         </td>
//                     </tr>
//                     ${footerHtml}
//                 </table>
//             </td>
//         </tr>
//     </table>
// </body>
// </html>`;
// }

// function normalizePath(filePath) {
//     if (!filePath) return null;
//     return path.resolve(__dirname, '..', String(filePath).replace(/^\//, ''));
// }

// function getImageAttachment(filePath, cid, fallbackName) {
//     try {
//         const absPath = normalizePath(filePath);
//         if (!absPath || !fs.existsSync(absPath)) return null;

//         const ext = path.extname(absPath).replace('.', '').toLowerCase() || 'png';
//         return {
//             filename: `${fallbackName}.${ext}`,
//             content: fs.readFileSync(absPath),
//             cid
//         };
//     } catch (error) {
//         console.error('[EmailTemplateGenerator] image attachment failed:', error.message);
//         return null;
//     }
// }

// function esc(value) {
//     return String(value ?? '')
//         .replace(/&/g, '&amp;')
//         .replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;')
//         .replace(/"/g, '&quot;')
//         .replace(/'/g, '&#039;');
// }

// function money(value) {
//     const n = Number(value || 0);
//     return `₹ ${n.toLocaleString('en-IN', {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 2
//     })}`;
// }

// function fmtDate(value, fallback = '—') {
//     if (!value) return fallback;
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return esc(value);
//     return d.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });
// }

// function safeArray(value, fallback = []) {
//     return Array.isArray(value) && value.length ? value : fallback;
// }

// function svgDataUri(svg) {
//     return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
// }

// function iconImg(kind, size = 38) {
//     const svgMap = {
//         user: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
//             <circle cx="20" cy="14" r="5.2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
//             <path d="M11.5 28.5c1.9-4.9 5.3-7.2 8.5-7.2s6.6 2.3 8.5 7.2" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
//         </svg>`,
//         accounts: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
//             <rect x="12" y="10.5" width="16" height="19" rx="1.8" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
//             <circle cx="20" cy="14.5" r="1.3" fill="#2d8f4d"/>
//             <path d="M15 19h10M15 22.8h10M15 26.6h10" stroke="#2d8f4d" stroke-width="1.6" stroke-linecap="round"/>
//         </svg>`,
//         headset: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
//             <path d="M12.5 19c0-4.8 3.7-8.5 7.5-8.5s7.5 3.7 7.5 8.5" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
//             <rect x="10.5" y="18.5" width="4.8" height="8" rx="2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
//             <rect x="24.7" y="18.5" width="4.8" height="8" rx="2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
//             <path d="M29.5 27.2c0 2.2-2.5 3.8-5.8 3.8h-1.4" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
//         </svg>`,
//         facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#1877f2"/><path d="M22.4 33V21.4h3.2l.5-4h-3.7v-2.5c0-1.2.3-2 2-2h1.8V9.3c-.3 0-1.5-.1-2.9-.1-2.9 0-4.8 1.8-4.8 5.1v3.1h-3.2v4h3.2V33z" fill="#fff"/>
//         </svg>`,
//         instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#e1306c"/><rect x="12" y="12" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="25.3" cy="14.8" r="1.2" fill="#fff"/>
//         </svg>`,
//         linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#0a66c2"/><rect x="12" y="16" width="3" height="12" fill="#fff"/><rect x="12" y="12" width="3" height="3" fill="#fff"/><path d="M18 16h2.8v1.7h.1c.8-1.3 2.1-2.1 4-2.1 3 0 4.6 1.9 4.6 5.6V28h-3v-5.9c0-1.7-.6-2.9-2.3-2.9-1.3 0-2.1.9-2.4 1.7-.1.3-.1.7-.1 1.1V28H18z" fill="#fff"/>
//         </svg>`,
//         youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
//             <circle cx="20" cy="20" r="19" fill="#ff0000"/><path d="M29.4 15.8c-.2-1.2-1.2-2.2-2.4-2.4-2-.3-4.6-.4-7-.4s-5 .1-7 .4c-1.2.2-2.2 1.2-2.4 2.4-.3 1.8-.4 3-.4 4.2s.1 2.4.4 4.2c.2 1.2 1.2 2.2 2.4 2.4 2 .3 4.6.4 7 .4s5-.1 7-.4c1.2-.2 2.2-1.2 2.4-2.4.3-1.8.4-3 .4-4.2s-.1-2.4-.4-4.2z" fill="#fff" opacity=".18"/><path d="M17 15.8v8.4l7-4.2z" fill="#fff"/>
//         </svg>`
//     };
//     const svg = svgMap[kind];
//     return svg ? `<img src="${svgDataUri(svg)}" alt="" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;" />` : '';
// }

// function bulletList(items, columns = 1) {
//     const safeItems = safeArray(items);
//     if (!safeItems.length) return '<span style="color:#7a8191;">—</span>';

//     if (columns <= 1) {
//         return safeItems.map((item) => `
//             <div style="margin:0 0 6px 0;font-size:12px;line-height:1.35;color:#1b2140;">
//                 <span style="color:#0d2f98;font-weight:700;margin-right:6px;">•</span>${esc(item)}
//             </div>
//         `).join('');
//     }

//     const left = [];
//     const right = [];
//     safeItems.forEach((item, index) => (index % 2 === 0 ? left : right).push(item));

//     const render = (arr) => arr.map((item) => `
//         <div style="margin:0 0 6px 0;font-size:12px;line-height:1.35;color:#1b2140;">
//             <span style="color:#0d2f98;font-weight:700;margin-right:6px;">•</span>${esc(item)}
//         </div>
//     `).join('');

//     return `
//         <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//             <tr>
//                 <td width="50%" valign="top" style="padding-right:8px;">${render(left)}</td>
//                 <td width="50%" valign="top" style="padding-left:8px;">${render(right)}</td>
//             </tr>
//         </table>
//     `;
// }

// function infoRows(rows, options = {}) {
//     const labelWidth = options.labelWidth || 52;
//     return rows.map(([label, value, style = '']) => `
//         <tr>
//             <td width="${labelWidth}%" valign="top"
//                 style="padding:5px 8px 5px 0;border-bottom:1px dotted #d8deec;font-size:12px;line-height:1.28;color:#28304d;">
//                 ${esc(label)}
//             </td>
//             <td width="4%" valign="top"
//                 style="padding:5px 2px;border-bottom:1px dotted #d8deec;font-size:12px;color:#28304d;">:</td>
//             <td valign="top"
//                 style="padding:5px 0 5px 6px;border-bottom:1px dotted #d8deec;font-size:12px;line-height:1.28;color:#131a38;${style}">
//                 ${value === null || value === undefined || value === '' ? '—' : value}
//             </td>
//         </tr>
//     `).join('');
// }

// function sectionHeader(number, title, color) {
//     return `
//         <table role="presentation" cellspacing="0" cellpadding="0" border="0"
//             style="border-collapse:collapse;margin:0;">
//             <tr>
//                 <td style="background:${color};color:#fff;font-size:15px;font-weight:800;line-height:1;padding:8px 12px;border-radius:5px 5px 0 0;white-space:nowrap;">
//                     ${number ? `${esc(number)}.&nbsp;&nbsp;` : ''}${esc(title)}
//                 </td>
//             </tr>
//         </table>
//     `;
// }

// function actionButton(label, url, color) {
//     const href = url || '#';
//     return `
//         <a href="${esc(href)}"
//            style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:11px;font-weight:800;line-height:1;padding:10px 18px;border-radius:4px;text-transform:uppercase;">
//             ${esc(label)} &nbsp;→
//         </a>
//     `;
// }

// function downloadIcon(kind, color, size = 42) {
//     const commonStart = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">`;
//     const commonEnd = `</svg>`;

//     const invoiceSvg = `${commonStart}
//         <circle cx="24" cy="24" r="22" fill="#f7f8ff" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>
//         <path d="M17 11.5h10.8L34 17.7V36.5H17z"
//               fill="none" stroke="${color}" stroke-width="2.15"
//               stroke-linejoin="round"/>
//         <path d="M27.8 11.5v6.3H34"
//               fill="none" stroke="${color}" stroke-width="2.15"
//               stroke-linejoin="round"/>
//         <path d="M21 23h8.2M21 27h8.2M21 31h5.4"
//               fill="none" stroke="${color}" stroke-width="1.9"
//               stroke-linecap="round"/>
//     ${commonEnd}`;

//     const paymentSvg = `${commonStart}
//         <circle cx="24" cy="24" r="22" fill="#f3fbf5" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>
//         <path d="M15.8 10.8h11L33 17v18.2H15.8z"
//               fill="none" stroke="${color}" stroke-width="2.15"
//               stroke-linejoin="round"/>
//         <path d="M26.8 10.8V17H33"
//               fill="none" stroke="${color}" stroke-width="2.15"
//               stroke-linejoin="round"/>
//         <path d="M20.1 22h7.5M20.1 25.6h5.9"
//               fill="none" stroke="${color}" stroke-width="1.7"
//               stroke-linecap="round"/>
//         <text x="20.2" y="32.3"
//               font-family="Arial,Helvetica,sans-serif"
//               font-size="10.4"
//               font-weight="700"
//               fill="${color}">₹</text>
//         <circle cx="34.2" cy="34.3" r="5.4"
//                 fill="#ffffff" stroke="${color}" stroke-width="1.75"/>
//         <path d="M34.2 31.2v3.4l2.2 1.35"
//               fill="none" stroke="${color}" stroke-width="1.55"
//               stroke-linecap="round" stroke-linejoin="round"/>
//     ${commonEnd}`;

//     const svg = kind === 'paymentReceipt' ? paymentSvg : invoiceSvg;

//     return `<img
//         src="${svgDataUri(svg)}"
//         alt=""
//         width="${size}"
//         height="${size}"
//         style="display:block;width:${size}px;height:${size}px;border:0;outline:none;"
//     />`;
// }

// function downloadCard(title, text, url, color, iconKind) {
//     return `
//         <div style="padding:4px 2px;">
//             <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//                 <tr>
//                     <td width="48" valign="top">
//                         ${downloadIcon(iconKind, color, 42)}
//                     </td>
//                     <td valign="top" style="padding-left:10px;">
//                         <div style="font-size:12px;font-weight:800;color:${color};text-transform:uppercase;margin-bottom:5px;">${esc(title)}</div>
//                         <div style="font-size:11px;line-height:1.35;color:#333b55;margin-bottom:8px;">${esc(text)}</div>
//                         <a href="${esc(url || '#')}"
//                            style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:10px;font-weight:800;padding:8px 15px;border-radius:4px;text-transform:uppercase;">
//                             ↓ &nbsp; DOWNLOAD
//                         </a>
//                     </td>
//                 </tr>
//             </table>
//         </div>
//     `;
// }

// class EmailTemplateGenerator {
//     async getTemplate(formType) {
//         if (!formType) return null;
//         return MessageTemplate.findOne({ formType }).lean();
//     }

//     resolvePlaceholderValue(key, data = {}) {
//         const aliases = {
//             NAME: data.fullName || data.name || [data.firstName, data.lastName].filter(Boolean).join(' '),
//             REG_ID: data.registrationId || data.regId,
//             REGISTRATION_ID: data.registrationId || data.regId,
//             COMPANY: data.companyName || data.company || data.organization || data.organizationName,
//             EXHIBITOR_NAME: data.exhibitorName || data.exhibitor_name || data.companyName || data.name,
//             CONTACT_PERSON: data.contactPerson || data.contact_person || data.contact1?.name,
//             EMAIL: data.email || data.officialEmail || data.contact1?.email,
//             PHONE: data.phone || data.mobile || data.mobileNumber || data.contact1?.mobile,
//             MOBILE: data.mobile || data.phone || data.mobileNumber || data.contact1?.mobile,
//             EVENT_NAME: data.eventName || data.event_name,
//             STALL_NO: data.stallNo || data.stall_no || data.stallFor,
//             TOTAL_AMOUNT: data.totalAmount || data.total_amount,
//             AMOUNT_PAID: data.amountPaid || data.amount_paid,
//             BALANCE_DUE: data.balanceDue || data.balance_due,
//             PAYMENT_STATUS: data.paymentStatus || data.payment_status,
//             PAYMENT_MODE: data.paymentMode || data.payment_mode,
//             PAYMENT_METHOD: data.paymentMethod || data.payment_method,
//             TRANSACTION_ID: data.transactionId || data.transaction_id,
//             ORDER_NO: data.orderNo || data.order_no,
//             GRAND_TOTAL: data.grandTotal || data.grand_total
//         };

//         const upperKey = String(key || '').toUpperCase();
//         if (aliases[upperKey] !== undefined && aliases[upperKey] !== '') return aliases[upperKey];

//         const cleanUpperKey = upperKey.replace(/_/g, '');
//         for (const [dataKey, value] of Object.entries(data)) {
//             if (String(dataKey).toUpperCase().replace(/_/g, '') === cleanUpperKey) {
//                 return value;
//             }
//         }

//         return null;
//     }

//     applyPlaceholders(content, data = {}) {
//         if (!content) return '';
//         return String(content).replace(/\[\[\s*([a-zA-Z0-9_]+)\s*\]\]/g, (match, key) => {
//             const value = this.resolvePlaceholderValue(key, data);
//             return value === null || value === undefined ? match : String(value);
//         });
//     }

//     buildTemplateAssets(template = {}) {
//         const attachments = [];

//         // Default IHWE header image.
//         // If MessageTemplate has its own headerImage, that will still take priority.
//         const headerImagePath = template.headerImage || 'utils/images/amann.png';

//         const headerAttachment = getImageAttachment(headerImagePath, 'email_header_img', 'header');
//         const footerAttachment = getImageAttachment(template.footerImage, 'email_footer_img', 'footer');
//         const smallLogoAttachment = getImageAttachment(template.smallLogo, 'email_small_logo_img', 'small-logo');

//         if (headerAttachment) attachments.push(headerAttachment);
//         if (footerAttachment) attachments.push(footerAttachment);
//         if (smallLogoAttachment) attachments.push(smallLogoAttachment);

//         return {
//             attachments,
//             headerCid: headerAttachment ? 'email_header_img' : null,
//             footerCid: footerAttachment ? 'email_footer_img' : null,
//             smallLogoCid: smallLogoAttachment ? 'email_small_logo_img' : null
//         };
//     }

//     /**
//      * Exact compact IHWE 2026 exhibitor confirmation layout.
//      *
//      * IMPORTANT:
//      * - Header/footer should be uploaded on the MessageTemplate record.
//      * - Those images are embedded as CID attachments, so Gmail/Outlook render them reliably.
//      * - Body uses email-safe tables + inline CSS; no flex/grid dependency.
//      * - There is no internal scrollbar and no horizontal overflow.
//      */
//     buildIHWEConfirmationBody(data = {}) {
//         const eventName = data.eventName || '9th International Health & Wellness Expo 2026 – Global Edition';
//         const clientName = data.clientName || data.contactPerson || data.name || '[Client Name]';
//         const companyName = data.companyName || data.exhibitorName || data.organizationName || '—';

//         const installments = safeArray(data.installments, [
//             {
//                 label: '1st Installment (Paid)',
//                 dueDate: data.firstInstallmentDate || data.paymentDate || '08 Aug 2026',
//                 amount: data.amountPaid || 40000,
//                 status: 'PAID'
//             },
//             {
//                 label: '2nd Installment',
//                 dueDate: data.secondInstallmentDate || '20 Aug 2026',
//                 amount: data.secondInstallmentAmount || 38410,
//                 status: 'PENDING'
//             },
//             {
//                 label: '3rd Installment',
//                 dueDate: data.thirdInstallmentDate || '05 Sep 2026',
//                 amount: data.thirdInstallmentAmount || 38410,
//                 status: 'PENDING'
//             }
//         ]);

//         const installmentRows = installments.map((item, index) => {
//             const paid = String(item.status || '').toUpperCase() === 'PAID';
//             return `
//                 <tr>
//                     <td style="padding:8px 6px;border:1px solid #dbe1ef;font-size:10px;line-height:1.25;font-weight:${index === 0 ? '700' : '600'};color:#1e2542;text-align:center;">
//                         ${esc(item.label || `Installment ${index + 1}`)}
//                     </td>
//                     <td style="padding:8px 5px;border:1px solid #dbe1ef;font-size:10px;color:#1e2542;text-align:center;white-space:nowrap;">
//                         ${fmtDate(item.dueDate, item.dueDate || '—')}
//                     </td>
//                     <td style="padding:8px 5px;border:1px solid #dbe1ef;font-size:10px;color:#1e2542;text-align:center;white-space:nowrap;">
//                         ${money(item.amount)}
//                     </td>
//                     <td style="padding:8px 5px;border:1px solid #dbe1ef;font-size:10px;font-weight:800;text-align:center;color:${paid ? '#14813a' : '#f04a1e'};">
//                         ${esc(item.status || 'PENDING')}
//                     </td>
//                 </tr>
//             `;
//         }).join('');

//         const stallInclusions = safeArray(data.shellSchemeInclusions, [
//             'Fascia Name Board',
//             'Carpet',
//             '3 Spot Lights',
//             '1 Table',
//             '2 Chairs',
//             '1 Power Point',
//             'Dustbin'
//         ]);

//         const passes = safeArray(data.exhibitorPasses, [
//             '10 Visitor Passes',
//             '2 Exhibitor Passes',
//             '4 Service Passes',
//             '2 Vehicle Passes'
//         ]);

//         const hospitality = safeArray(data.hospitality, [
//             '2 Lunches + 2 Water Bottles per day for all 3 days of the event.'
//         ]);

//         const relationshipManager = data.relationshipManager || {};
//         const accountsSupport = data.accountsSupport || {};
//         const exhibitorHelpline = data.exhibitorHelpline || {};

//         return `
//         <div style="font-family:Arial,Helvetica,sans-serif;color:#171d3d;background:#fff;">
//             <!-- Greeting -->
//             <div style="padding:30px 18px 6px 18px;">
//                 <div style="font-size:18px;line-height:1.25;font-weight:800;color:#1735aa;margin:0 0 9px 0;">
//                     Dear ${esc(clientName)}, <span style="color:#f04a1e;">Namo Gange Namaskar!</span>
//                 </div>

//                 <div style="font-size:12px;line-height:1.48;color:#17203e;">
//                     <p style="margin:0 0 8px 0;">
//                         We are pleased to confirm your participation in the <strong>${esc(eventName)}</strong>.
//                     </p>
//                     <p style="margin:0 0 8px 0;">
//                         Your booking amount has been received successfully. You have opted for the installment plan and your
//                         <strong>${esc(String(installments.length))} installment(s)</strong> are pending as per the schedule given in the summary below.
//                         We sincerely thank you for your trust and continued association with us.
//                     </p>
//                     <p style="margin:0 0 8px 0;">
//                         IHWE 2026 is India’s most impactful health &amp; wellness platform, bringing together global exhibitors, healthcare professionals,
//                         industry leaders, buyers and thought leaders on one dynamic platform to collaborate, innovate and create lasting impact.
//                     </p>
//                     <p style="margin:0 0 8px 0;">
//                         We are committed to delivering an exceptional experience and ensuring you achieve the best possible outcomes through
//                         meaningful business connections, brand visibility and knowledge exchange.
//                     </p>
//                     <p style="margin:0 0 9px 0;font-weight:700;">
//                         We look forward to welcoming your esteemed organization to Pragati Maidan, New Delhi, from 21 – 23 August 2026.
//                     </p>
//                 </div>
//             </div>

//             <!-- 1. Booking & Payment Summary -->
//             <div style="padding:0 14px 8px 14px;">
//                 <div style="border:1px solid #d7deee;border-radius:6px;overflow:hidden;background:#fff;">
//                     ${sectionHeader('1', 'BOOKING & PAYMENT SUMMARY', '#1635aa')}
//                     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                         style="border-collapse:collapse;">
//                         <tr>
//                             <!-- Left summary -->
//                             <td width="36%" valign="top" style="padding:8px 12px;border-right:1px dotted #cfd6e7;">
//                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                                     style="border-collapse:collapse;">
//                                     ${infoRows([
//                                         ['Company Name', `<strong>${esc(companyName)}</strong>`],
//                                         ['Proforma Invoice No.', esc(data.proformaInvoiceNo || data.invoiceNo || '—')],
//                                         ['Booking / Invoice Amount', money(data.bookingAmount || data.invoiceAmount || data.totalAmount)],
//                                         ['TDS Deducted (as applicable)', money(data.tdsDeducted || 0)],
//                                         ['Net Payable Amount', `<strong style="font-size:14px;color:#1635aa;">${money(data.netPayable || data.totalAmount)}</strong>`],
//                                         ['Booking Amount Received', `<strong style="font-size:14px;color:#14813a;">${money(data.amountPaid)}</strong>`],
//                                         ['Balance Amount', `<strong style="font-size:14px;color:#f04a1e;">${money(data.balanceDue)}</strong>`],
//                                         ['Payment Status', `<strong style="color:#f04a1e;">${esc(data.paymentStatus || 'PARTIAL')}</strong>`],
//                                         ['Payment Date', fmtDate(data.paymentDate)]
//                                     ], { labelWidth: 51 })}
//                                 </table>
//                             </td>

//                             <!-- Center installment schedule -->
//                             <td width="39%" valign="top" style="padding:8px 12px;border-right:1px dotted #cfd6e7;">
//                                 <div style="font-size:12px;font-weight:800;color:#1735aa;text-transform:uppercase;margin:0 0 8px 0;">
//                                     INSTALLMENT SCHEDULE
//                                 </div>
//                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                                     style="border-collapse:collapse;">
//                                     <tr style="background:#f4f6fb;">
//                                         <th style="padding:7px 5px;border:1px solid #dbe1ef;font-size:9px;color:#202742;">Installment</th>
//                                         <th style="padding:7px 5px;border:1px solid #dbe1ef;font-size:9px;color:#202742;">Due Date</th>
//                                         <th style="padding:7px 5px;border:1px solid #dbe1ef;font-size:9px;color:#202742;">Amount (₹)</th>
//                                         <th style="padding:7px 5px;border:1px solid #dbe1ef;font-size:9px;color:#202742;">Status</th>
//                                     </tr>
//                                     ${installmentRows}
//                                 </table>
//                                 <div style="font-size:10px;line-height:1.35;font-weight:700;color:#e8332a;margin-top:7px;">
//                                     Note: Please make the pending payment(s) on or before the due date to avoid late payment charges and ensure smooth participation.
//                                 </div>
//                             </td>

//                             <!-- Right downloads -->
//                             <td width="25%" valign="top" style="padding:8px 12px;">
//                                 ${downloadCard(
//                                     'PROFORMA INVOICE',
//                                     'You can download your Proforma Invoice for future reference.',
//                                     data.proformaInvoiceUrl,
//                                     '#1635aa',
//                                     'invoice'
//                                 )}
//                                 <div style="border-top:1px dotted #cfd6e7;margin:9px 0;"></div>
//                                 ${downloadCard(
//                                     'PAYMENT RECEIPT',
//                                     'You can download your Payment Receipt for future reference.',
//                                     data.paymentReceiptUrl,
//                                     '#0c7b31',
//                                     'paymentReceipt'
//                                 )}
//                             </td>
//                         </tr>
//                     </table>
//                 </div>
//             </div>

//             <!-- 2. Stall details -->
//             <div style="padding:0 14px 8px 14px;">
//                 <div style="border:1px solid #d7e7dc;border-radius:6px;overflow:hidden;background:#fff;">
//                     ${sectionHeader('2', 'STALL DETAILS & INCLUSIONS', '#0c7b31')}
//                     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                         style="border-collapse:collapse;">
//                         <tr>
//                             <td width="28%" valign="top" style="padding:8px 12px;border-right:1px dotted #cfd6e7;">
//                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                                     style="border-collapse:collapse;">
//                                     ${infoRows([
//                                         ['Stall No.', esc(data.stallNo || '—')],
//                                         ['Hall No.', esc(data.hallNo || '12')],
//                                         ['Stall Size', esc(data.stallSize || '—')],
//                                         ['Stall Type', esc(data.stallType || '—')],
//                                         ['Stall Position', `<strong style="color:#0c7b31;">${esc(data.stallPosition || '—')}</strong>`],
//                                         ['Floor Plan Reference', esc(data.floorPlanReference || data.floorPlanRef || '—')]
//                                     ], { labelWidth: 43 })}
//                                 </table>
//                             </td>

//                             <td width="36%" valign="top" style="padding:8px 12px;border-right:1px dotted #cfd6e7;">
//                                 <div style="font-size:12px;font-weight:800;color:#0c7b31;margin-bottom:7px;">
//                                     SHELL SCHEME INCLUSIONS (${esc(data.stallSize || '9 SQ. MTR.')})
//                                 </div>
//                                 ${bulletList(stallInclusions, 2)}
//                                 <div style="height:1px;background:#d9e2dc;margin:8px 0;"></div>
//                                 <div style="font-size:12px;font-weight:800;color:#0c7b31;margin-bottom:6px;">EXHIBITOR HOSPITALITY</div>
//                                 ${bulletList(hospitality)}
//                             </td>

//                             <td width="36%" valign="top" style="padding:8px 12px;">
//                                 <div style="font-size:12px;font-weight:800;color:#0c7b31;margin-bottom:7px;">
//                                     EXHIBITOR PASSES (As per booked package)
//                                 </div>
//                                 ${bulletList(passes, 2)}
//                             </td>
//                         </tr>
//                     </table>
//                 </div>
//             </div>

//             <!-- 3 & 4 side-by-side -->
//             <div style="padding:0 14px 8px 14px;">
//                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                     style="border-collapse:separate;border-spacing:0;">
//                     <tr>
//                         <td width="65%" valign="top" style="padding-right:5px;">
//                             <div style="border:1px solid #e1d9f2;border-radius:6px;padding:9px 12px;">
//                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//                                     <tr>
//                                         <td valign="top">
//                                             <div style="font-size:15px;font-weight:800;color:#5020b4;margin-bottom:2px;">
//                                                 3.&nbsp;&nbsp;18<sup>TH</sup> INTEGRATED AROGYA SANGHOSHTHI
//                                             </div>
//                                             <div style="font-size:10px;font-weight:700;color:#5020b4;margin-bottom:7px;">
//                                                 21 – 23 August 2026 &nbsp; | &nbsp; Pragati Maidan
//                                             </div>
//                                             <div style="font-size:11px;line-height:1.42;color:#252c48;">
//                                                 A three-day premier knowledge platform featuring 3 sessions per day and 30–45 renowned speakers including
//                                                 Doctors, Researchers, Academicians, AYUSH Experts, Industry Leaders and Students.
//                                             </div>
//                                             <div style="font-size:11px;line-height:1.42;color:#252c48;margin-top:6px;">
//                                                 The platform fosters insightful discussions, knowledge exchange and innovation across healthcare, AYUSH, wellness and preventive health.
//                                             </div>
//                                         </td>
//                                         <td width="34%" valign="top" style="padding-left:12px;border-left:1px dotted #d6cce9;">
//                                             <div style="font-size:12px;font-weight:800;color:#5020b4;margin-bottom:6px;">REGISTER DELEGATES</div>
//                                             <div style="font-size:11px;line-height:1.42;color:#353b52;margin-bottom:9px;">
//                                                 Secure your seat and participate in insightful sessions, earn certificates with experts and peers from across the globe.
//                                             </div>
//                                             ${actionButton('REGISTER NOW', data.arogyaRegistrationUrl, '#6a20c5')}
//                                         </td>
//                                     </tr>
//                                 </table>
//                             </div>
//                         </td>

//                         <td width="35%" valign="top" style="padding-left:5px;">
//                             <div style="border:1px solid #f3ddd6;border-radius:6px;padding:9px 12px;">
//                                 <div style="font-size:15px;font-weight:800;color:#ec4b20;margin-bottom:6px;">
//                                     4.&nbsp;&nbsp;BUYER–SELLER MEET <span style="font-size:8px;">(2<sup>ND</sup> EDITION)</span>
//                                 </div>
//                                 <div style="font-size:11px;line-height:1.42;color:#353b52;">
//                                     Connect with International &amp; Domestic Buyers, Distributors, Importers, Exporters, Institutional Buyers and Industry Decision Makers in pre-scheduled B2B meetings.
//                                 </div>
//                                 <div style="font-size:11px;line-height:1.42;color:#353b52;margin:6px 0 9px 0;">
//                                     This is your opportunity to showcase your products, expand your reach, build strong business relationships and explore new markets.
//                                 </div>
//                                 ${actionButton('REGISTER NOW', data.buyerSellerRegistrationUrl, '#f04a1e')}
//                             </div>
//                         </td>
//                     </tr>
//                 </table>
//             </div>

//             <!-- 5. Dashboard -->
//             <div style="padding:0 14px 8px 14px;">
//                 <div style="border:1px solid #d7deee;border-radius:6px;padding:9px 12px;">
//                     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//                         <tr>
//                             <td width="40%" valign="top">
//                                 <div style="font-size:15px;font-weight:800;color:#1735aa;margin-bottom:5px;">
//                                     5.&nbsp;&nbsp;EXHIBITOR DASHBOARD ACCESS
//                                 </div>
//                                 <div style="font-size:11px;line-height:1.42;color:#353b52;">
//                                     Your one-stop platform to manage your profile, passes, documents, service requests and all event-related activities conveniently.
//                                     Log in to access all essential tools and stay updated throughout the event journey.
//                                 </div>
//                             </td>
//                             <td width="37%" valign="top" style="padding-left:12px;border-left:1px dotted #cfd6e7;">
//                                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//                                     style="border-collapse:collapse;">
//                                     ${infoRows([
//                                         ['Dashboard URL', `<a href="${esc(data.dashboardUrl || 'https://exhibitor.ihwe.in/login')}" style="color:#1735aa;font-weight:700;text-decoration:none;">${esc(data.dashboardUrl || 'https://exhibitor.ihwe.in/login')}</a>`],
//                                         ['Username', `<strong style="color:#1735aa;">${esc(data.dashboardUsername || data.username || '[username]')}</strong>`],
//                                         ['Temporary Password', `<strong style="color:#1735aa;">${esc(data.temporaryPassword || data.password || '[password]')}</strong>`]
//                                     ], { labelWidth: 43 })}
//                                 </table>
//                                 <div style="font-size:9px;color:#5e6578;margin-top:5px;">(Please change your password after first login)</div>
//                             </td>
//                             <td width="23%" valign="middle" align="center" style="padding-left:12px;border-left:1px dotted #cfd6e7;">
//                                 ${actionButton('LOGIN TO DASHBOARD', data.dashboardUrl || 'https://exhibitor.ihwe.in/login', '#1735aa')}
//                                 <div style="font-size:10px;line-height:1.35;color:#1735aa;font-weight:700;margin-top:7px;">
//                                     All your event essentials<br>in one place.
//                                 </div>
//                             </td>
//                         </tr>
//                     </table>
//                 </div>
//             </div>

//             <!-- 6. Support team -->
//             <div style="padding:0 14px 8px 14px;">
//                 <div style="border:1px solid #d7e7dc;border-radius:6px;padding:9px 12px;">
//                     <div style="font-size:15px;font-weight:800;color:#14786c;margin-bottom:8px;">
//                         6.&nbsp;&nbsp;YOUR RELATIONSHIP &amp; SUPPORT TEAM
//                     </div>
//                     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//                         <tr>
//                             <td width="25%" valign="top" style="padding-right:9px;border-right:1px dotted #cfd6e7;">
//                                 <table role="presentation" cellspacing="0" cellpadding="0" border="0">
//                                     <tr>
//                                         <td valign="top" style="padding-right:8px;">${iconImg('user', 36)}</td>
//                                         <td valign="top">
//                                             <div style="font-size:10px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:5px;">RELATIONSHIP MANAGER</div>
//                                             <div style="font-size:11px;line-height:1.38;color:#28304d;">
//                                                 ${esc(relationshipManager.name || 'Mr. Vimal Chopra')}<br>
//                                                 ${esc(relationshipManager.phone || '+91 96549 00525')}<br>
//                                                 ${esc(relationshipManager.email || 'crm@namogangewellness.com')}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 </table>
//                             </td>
//                             <td width="25%" valign="top" style="padding:0 9px;border-right:1px dotted #cfd6e7;">
//                                 <table role="presentation" cellspacing="0" cellpadding="0" border="0">
//                                     <tr>
//                                         <td valign="top" style="padding-right:8px;">${iconImg('accounts', 36)}</td>
//                                         <td valign="top">
//                                             <div style="font-size:10px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:5px;">ACCOUNTS SUPPORT</div>
//                                             <div style="font-size:11px;line-height:1.38;color:#28304d;">
//                                                 ${esc(accountsSupport.phone || '+91 99534 56789')}<br>
//                                                 ${esc(accountsSupport.email || 'accounts@namogangewellness.com')}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 </table>
//                             </td>
//                             <td width="25%" valign="top" style="padding:0 9px;border-right:1px dotted #cfd6e7;">
//                                 <table role="presentation" cellspacing="0" cellpadding="0" border="0">
//                                     <tr>
//                                         <td valign="top" style="padding-right:8px;">${iconImg('headset', 36)}</td>
//                                         <td valign="top">
//                                             <div style="font-size:10px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:5px;">EXHIBITOR HELPLINE</div>
//                                             <div style="font-size:11px;line-height:1.38;color:#28304d;">
//                                                 ${esc(exhibitorHelpline.phone || '+91 96549 00525')}<br>
//                                                 ${esc(exhibitorHelpline.email || 'expo@namogangewellness.com')}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 </table>
//                             </td>
//                             <td width="25%" valign="top" style="padding-left:10px;text-align:center;">
//                                 <div style="font-size:10px;line-height:1.35;color:#41485e;">
//                                     For stall, passes, services or any event-related assistance, please contact your Relationship Manager.
//                                 </div>
//                                 <div style="font-size:11px;line-height:1.35;color:#14786c;font-weight:800;margin-top:5px;">
//                                     We are committed to making your participation seamless and successful!
//                                 </div>
//                             </td>
//                         </tr>
//                     </table>
//                 </div>
//             </div>

//             <!-- Bottom footer row -->
//             <div style="padding:0 14px 14px 14px;">
//                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
//                     <tr>
//                         <td width="73%" valign="middle" style="padding:8px 4px 0 4px;white-space:nowrap;">
//                             <span style="font-size:11px;font-weight:800;color:#1735aa;text-transform:uppercase;">HEAD OFFICE:</span>
//                             <span style="font-size:10px;line-height:1.3;color:#28304d;margin-left:7px;">
//                                 ${esc(data.headOfficeText || 'Namo Gange Wellness Pvt. Ltd., 608, 6th Floor, Pearls Best Heights–II, Netaji Subhash Place, Pitampura, New Delhi – 110034, India')}
//                             </span>
//                         </td>
//                         <td width="27%" valign="middle" align="right" style="padding:8px 4px 0 4px;white-space:nowrap;">
//                             <span style="font-size:11px;font-weight:800;color:#1f2848;text-transform:uppercase;margin-right:7px;">FOLLOW US ON:</span>
//                             <a href="${esc(data.facebookUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:4px;">${iconImg('facebook', 18)}</a>
//                             <a href="${esc(data.instagramUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:4px;">${iconImg('instagram', 18)}</a>
//                             <a href="${esc(data.linkedinUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:4px;">${iconImg('linkedin', 18)}</a>
//                             <a href="${esc(data.youtubeUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:4px;">${iconImg('youtube', 18)}</a>
//                         </td>
//                     </tr>
//                 </table>
//             </div>
//         </div>
//         `;
//     }

//     async generateFromTemplate(formType, data = {}, options = {}) {
//         const template = await this.getTemplate(formType);
//         if (!template) {
//             throw new Error(`Email template not found: ${formType}`);
//         }

//         const subject = this.applyPlaceholders(template.emailSubject, data);
//         const assets = this.buildTemplateAssets(template);

//         const useIHWELayout =
//             options.layout === 'ihwe-confirmation' ||
//             formType === 'exhibitor_booking_confirmation';

//         let body;

//         if (useIHWELayout) {
//             body = this.buildIHWEConfirmationBody(data);
//         } else {
//             body = this.applyPlaceholders(template.emailBody, data);

//             if (assets.smallLogoCid) {
//                 body += `<div style="text-align:left;margin-top:20px;padding-top:20px;border-top:1px solid #eeeeee;">
//                     <img src="cid:${assets.smallLogoCid}" alt="Logo" width="150"
//                         style="display:block;max-width:150px;height:auto;border:0;" />
//                 </div>`;
//             }
//         }

//         const html = emailShell(body, {
//             headerImage: template.headerImage || 'utils/images/amann.png',
//             footerImage: template.footerImage,
//             headerCid: assets.headerCid,
//             footerCid: assets.footerCid,
//             padding: useIHWELayout ? 0 : options.padding,
//             hideFallbackFooter: useIHWELayout ? true : options.hideFallbackFooter,
//             compactFooter: options.compactFooter,
//             maxWidth: useIHWELayout ? 1024 : options.maxWidth
//         });

//         return {
//             subject,
//             body,
//             html,
//             attachments: [...assets.attachments, ...(options.attachments || [])],
//             template
//         };
//     }

//     /**
//      * Direct helper if you do not want to depend on a specific formType.
//      * Pass a MessageTemplate-compatible object containing headerImage/footerImage.
//      */
//     generateIHWEConfirmation({ subject = '', data = {}, template = {}, options = {} }) {
//         const assets = this.buildTemplateAssets(template);
//         const renderedSubject = this.applyPlaceholders(subject, data);
//         const body = this.buildIHWEConfirmationBody(data);

//         return {
//             subject: renderedSubject,
//             body,
//             html: emailShell(body, {
//                 headerImage: template.headerImage || 'utils/images/amann.png',
//                 footerImage: template.footerImage,
//                 headerCid: assets.headerCid,
//                 footerCid: assets.footerCid,
//                 padding: 0,
//                 hideFallbackFooter: true,
//                 compactFooter: true,
//                 maxWidth: options.maxWidth || 1024
//             }),
//             attachments: [...assets.attachments, ...(options.attachments || [])]
//         };
//     }

//     generateCustomTemplate({
//         subject = '',
//         body = '',
//         data = {},
//         headerImage = null,
//         footerImage = null,
//         smallLogo = null,
//         options = {}
//     }) {
//         const template = { headerImage, footerImage, smallLogo };
//         const renderedSubject = this.applyPlaceholders(subject, data);
//         let renderedBody = this.applyPlaceholders(body, data);
//         const assets = this.buildTemplateAssets(template);

//         if (assets.smallLogoCid) {
//             renderedBody += `<div style="text-align:left;margin-top:20px;padding-top:20px;border-top:1px solid #eeeeee;">
//                 <img src="cid:${assets.smallLogoCid}" alt="Logo" width="150"
//                     style="display:block;max-width:150px;height:auto;border:0;" />
//             </div>`;
//         }

//         return {
//             subject: renderedSubject,
//             body: renderedBody,
//             html: emailShell(renderedBody, {
//                 headerImage,
//                 footerImage,
//                 headerCid: assets.headerCid,
//                 footerCid: assets.footerCid,
//                 padding: options.padding,
//                 hideFallbackFooter: options.hideFallbackFooter,
//                 compactFooter: options.compactFooter,
//                 maxWidth: options.maxWidth
//             }),
//             attachments: [...assets.attachments, ...(options.attachments || [])]
//         };
//     }
// }

// module.exports = new EmailTemplateGenerator();
'use strict';

const fs = require('fs');
const path = require('path');
const MessageTemplate = require('../models/MessageTemplate');

function emailShell(body = '', options = {}) {
    const maxWidth = Number(options.maxWidth || 794);
    const padding = options.padding === undefined || options.padding === null
        ? 0
        : Number(options.padding);

    const headerSrc = options.headerCid
        ? `cid:${options.headerCid}`
        : (/^https?:\/\//i.test(String(options.headerImage || '')) ? options.headerImage : null);

    const footerSrc = options.footerCid
        ? `cid:${options.footerCid}`
        : (/^https?:\/\//i.test(String(options.footerImage || '')) ? options.footerImage : null);

    const headerHtml = headerSrc
        ? `<tr>
                <td style="padding:0;margin:0;line-height:0;font-size:0;background:#ffffff;">
                    <img src="${headerSrc}" alt="IHWE 2026"
                        width="${maxWidth}"
                        style="display:block;width:100%;max-width:${maxWidth}px;height:auto;margin:0;padding:0;border:0;outline:none;text-decoration:none;" />
                </td>
           </tr>`
        : '';

    const footerHtml = footerSrc
        ? `<tr>
                <td style="padding:0;margin:0;line-height:0;font-size:0;background:#ffffff;">
                    <img src="${footerSrc}" alt="Namo Gange Wellness"
                        width="${maxWidth}"
                        style="display:block;width:100%;max-width:${maxWidth}px;height:auto;margin:0;padding:0;border:0;outline:none;text-decoration:none;" />
                </td>
           </tr>`
        : (!options.hideFallbackFooter
            ? `<tr>
                    <td style="padding:9.3px 14px;background:#0d2f78;color:#ffffff;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:7.8px;line-height:1.35;">
                        Namo Gange Wellness Pvt. Ltd. &nbsp; | &nbsp; IHWE 2026
                    </td>
               </tr>`
            : '');

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>IHWE 2026</title>
    <style>
        html,body{margin:0!important;padding:0!important;width:100%!important;background:#f4f6fb!important;}
        table{border-spacing:0!important;}
        img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
        a{text-decoration:none;}
        @media only screen and (max-width:700px){
            .email-frame{width:100%!important;max-width:100%!important;}
        }
        @media print{
            @page{size:A4 portrait;margin:0;}
            html,body{width:210mm!important;min-height:297mm!important;background:#ffffff!important;}
            .email-frame{width:210mm!important;max-width:210mm!important;margin:0 auto!important;}
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;margin:0;padding:0;background:#f4f6fb;border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:0;">
                <table role="presentation" width="${maxWidth}" cellspacing="0" cellpadding="0" border="0"
                    class="email-frame"
                    style="width:100%;max-width:${maxWidth}px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d6ddeb;">
                    ${headerHtml}
                    <tr>
                        <td style="padding:${padding}px;background:#ffffff;">
                            ${body}
                        </td>
                    </tr>
                    ${footerHtml}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function normalizePath(filePath) {
    if (!filePath) return null;
    return path.resolve(__dirname, '..', String(filePath).replace(/^\//, ''));
}

function getImageAttachment(filePath, cid, fallbackName) {
    try {
        const absPath = normalizePath(filePath);
        if (!absPath || !fs.existsSync(absPath)) return null;

        const ext = path.extname(absPath).replace('.', '').toLowerCase() || 'png';
        return {
            filename: `${fallbackName}.${ext}`,
            content: fs.readFileSync(absPath),
            cid
        };
    } catch (error) {
        console.error('[EmailTemplateGenerator] image attachment failed:', error.message);
        return null;
    }
}

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function money(value) {
    const n = Number(value || 0);
    return `₹ ${n.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

function fmtDate(value, fallback = '—') {
    if (!value) return fallback;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return esc(value);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function safeArray(value, fallback = []) {
    return Array.isArray(value) && value.length ? value : fallback;
}

function pickValue(source, paths, fallback = '') {
    for (const pathKey of paths) {
        const value = String(pathKey).split('.').reduce((obj, key) => {
            if (obj === undefined || obj === null) return undefined;
            return obj[key];
        }, source);
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
}

function pickNumber(source, paths, fallback = 0) {
    const value = pickValue(source, paths, fallback);
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function fullName(...parts) {
    return parts.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function getLatestPayment(data = {}) {
    const history = Array.isArray(data.paymentHistory) ? data.paymentHistory : [];
    return history.length ? history[history.length - 1] : {};
}

function getPaidAmount(data = {}) {
    if (data.amountPaid !== undefined) return Number(data.amountPaid) || 0;
    if (data.paidAmount !== undefined) return Number(data.paidAmount) || 0;
    if (data.totalPaid !== undefined) return Number(data.totalPaid) || 0;
    if (data.receivedAmount !== undefined) return Number(data.receivedAmount) || 0;
    if (Array.isArray(data.paymentHistory)) {
        return data.paymentHistory.reduce((sum, payment) => sum + (Number(payment.amount || payment.paidAmount) || 0), 0);
    }
    return 0;
}

function normalizeInstallments(data = {}) {
    const source = Array.isArray(data.installments) ? data.installments : [];
    if (source.length) {
        return source.map((item, index) => {
            const dueAmount = Number(item.dueAmount ?? item.amount ?? item.installmentAmount ?? 0);
            const paidAmount = Number(item.paidAmount ?? 0);
            const status = String(item.status || '').toLowerCase();
            const isPaid = status === 'paid' || (dueAmount > 0 && paidAmount >= dueAmount);
            return {
                label: item.label || item.name || item.installmentLabel || `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Installment${isPaid ? ' (Paid)' : ''}`,
                dueDate: item.dueDate || item.paymentDueDate || item.date || item.paidAt,
                amount: dueAmount || paidAmount,
                status: isPaid ? 'PAID' : (status === 'partial' ? 'PARTIAL' : 'PENDING')
            };
        });
    }

    const paid = getPaidAmount(data);
    const balance = pickNumber(data, ['balanceDue', 'balanceAmount'], 0);
    const latestPayment = getLatestPayment(data);
    if (!paid && !balance) return [];

    const rows = [];
    if (paid > 0) {
        rows.push({
            label: 'Booking Advance (Paid)',
            dueDate: latestPayment.paidAt || data.paymentDate || data.paidAt,
            amount: paid,
            status: 'PAID'
        });
    }
    if (balance > 0) {
        rows.push({
            label: data.pendingInstallmentLabel || data.paymentPlanLabel || 'Balance Payment',
            dueDate: data.paymentDueDate || data.dueDate,
            amount: balance,
            status: 'PENDING'
        });
    }
    return rows;
}

function svgDataUri(svg) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function iconImg(kind, size = 30) {
    const svgMap = {
        user: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
            <circle cx="20" cy="14" r="5.2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
            <path d="M11.5 28.5c1.9-4.9 5.3-7.2 8.5-7.2s6.6 2.3 8.5 7.2" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`,
        accounts: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
            <rect x="12" y="10.5" width="16" height="19" rx="1.8" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
            <circle cx="20" cy="14.5" r="1.3" fill="#2d8f4d"/>
            <path d="M15 19h10M15 22.8h10M15 26.6h10" stroke="#2d8f4d" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`,
        headset: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#f3fbf5" stroke="#87b78d" stroke-width="1.5"/>
            <path d="M12.5 19c0-4.8 3.7-8.5 7.5-8.5s7.5 3.7 7.5 8.5" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="10.5" y="18.5" width="4.8" height="8" rx="2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
            <rect x="24.7" y="18.5" width="4.8" height="8" rx="2" fill="none" stroke="#2d8f4d" stroke-width="1.8"/>
            <path d="M29.5 27.2c0 2.2-2.5 3.8-5.8 3.8h-1.4" fill="none" stroke="#2d8f4d" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`,
        facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#1877f2"/><path d="M22.4 33V21.4h3.2l.5-4h-3.7v-2.5c0-1.2.3-2 2-2h1.8V9.3c-.3 0-1.5-.1-2.9-.1-2.9 0-4.8 1.8-4.8 5.1v3.1h-3.2v4h3.2V33z" fill="#fff"/>
        </svg>`,
        instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#e1306c"/><rect x="12" y="12" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="25.3" cy="14.8" r="1.2" fill="#fff"/>
        </svg>`,
        linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#0a66c2"/><rect x="12" y="16" width="3" height="12" fill="#fff"/><rect x="12" y="12" width="3" height="3" fill="#fff"/><path d="M18 16h2.8v1.7h.1c.8-1.3 2.1-2.1 4-2.1 3 0 4.6 1.9 4.6 5.6V28h-3v-5.9c0-1.7-.6-2.9-2.3-2.9-1.3 0-2.1.9-2.4 1.7-.1.3-.1.7-.1 1.1V28H18z" fill="#fff"/>
        </svg>`,
        youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#ff0000"/><path d="M29.4 15.8c-.2-1.2-1.2-2.2-2.4-2.4-2-.3-4.6-.4-7-.4s-5 .1-7 .4c-1.2.2-2.2 1.2-2.4 2.4-.3 1.8-.4 3-.4 4.2s.1 2.4.4 4.2c.2 1.2 1.2 2.2 2.4 2.4 2 .3 4.6.4 7 .4s5-.1 7-.4c1.2-.2 2.2-1.2 2.4-2.4.3-1.8.4-3 .4-4.2s-.1-2.4-.4-4.2z" fill="#fff" opacity=".18"/><path d="M17 15.8v8.4l7-4.2z" fill="#fff"/>
        </svg>`
    };
    const svg = svgMap[kind];
    return svg ? `<img src="${svgDataUri(svg)}" alt="" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;" />` : '';
}

function bulletList(items, columns = 1) {
    const safeItems = safeArray(items);
    if (!safeItems.length) return '<span style="color:#7a8191;">—</span>';

    if (columns <= 1) {
        return safeItems.map((item) => `
            <div style="margin:0 0 4.7px 0;font-size:9.3px;line-height:1.35;color:#1b2140;">
                <span style="color:#0d2f98;font-weight:700;margin-right:4.7px;">•</span>${esc(item)}
            </div>
        `).join('');
    }

    const left = [];
    const right = [];
    safeItems.forEach((item, index) => (index % 2 === 0 ? left : right).push(item));

    const render = (arr) => arr.map((item) => `
        <div style="margin:0 0 4.7px 0;font-size:9.3px;line-height:1.35;color:#1b2140;">
            <span style="color:#0d2f98;font-weight:700;margin-right:4.7px;">•</span>${esc(item)}
        </div>
    `).join('');

    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td width="50%" valign="top" style="padding-right:6.2px;">${render(left)}</td>
                <td width="50%" valign="top" style="padding-left:6.2px;">${render(right)}</td>
            </tr>
        </table>
    `;
}

function infoRows(rows, options = {}) {
    const labelWidth = options.labelWidth || 52;
    return rows.map(([label, value, style = '']) => `
        <tr>
            <td width="${labelWidth}%" valign="top"
                style="padding:4px 6.2px 4px 0;border-bottom:1px dotted #d8deec;font-size:9.3px;line-height:1.28;color:#28304d;">
                ${esc(label)}
            </td>
            <td width="4%" valign="top"
                style="padding:4px 1.6px;border-bottom:1px dotted #d8deec;font-size:9.3px;color:#28304d;">:</td>
            <td valign="top"
                style="padding:4px 0 4px 4.7px;border-bottom:1px dotted #d8deec;font-size:9.3px;line-height:1.28;color:#131a38;${style}">
                ${value === null || value === undefined || value === '' ? '—' : value}
            </td>
        </tr>
    `).join('');
}

function sectionHeader(number, title, color) {
    return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"
            style="border-collapse:collapse;margin:0;">
            <tr>
                <td style="background:${color};color:#fff;font-size:11.6px;font-weight:800;line-height:1;padding:6.2px 9.3px;border-radius:4px 4px 0 0;white-space:nowrap;">
                    ${number ? `${esc(number)}.&nbsp;&nbsp;` : ''}${esc(title)}
                </td>
            </tr>
        </table>
    `;
}

function actionButton(label, url, color) {
    const href = url || '#';
    return `
        <a href="${esc(href)}"
           style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:8.5px;font-weight:800;line-height:1;padding:7.8px 14px;border-radius:3px;text-transform:uppercase;">
            ${esc(label)} &nbsp;→
        </a>
    `;
}

function downloadIcon(kind, color, size = 33) {
    const commonStart = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">`;
    const commonEnd = `</svg>`;

    const invoiceSvg = `${commonStart}
        <circle cx="24" cy="24" r="22" fill="#f7f8ff" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>
        <path d="M17 11.5h10.8L34 17.7V36.5H17z"
              fill="none" stroke="${color}" stroke-width="2.15"
              stroke-linejoin="round"/>
        <path d="M27.8 11.5v6.3H34"
              fill="none" stroke="${color}" stroke-width="2.15"
              stroke-linejoin="round"/>
        <path d="M21 23h8.2M21 27h8.2M21 31h5.4"
              fill="none" stroke="${color}" stroke-width="1.9"
              stroke-linecap="round"/>
    ${commonEnd}`;

    const paymentSvg = `${commonStart}
        <circle cx="24" cy="24" r="22" fill="#f3fbf5" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>
        <path d="M15.8 10.8h11L33 17v18.2H15.8z"
              fill="none" stroke="${color}" stroke-width="2.15"
              stroke-linejoin="round"/>
        <path d="M26.8 10.8V17H33"
              fill="none" stroke="${color}" stroke-width="2.15"
              stroke-linejoin="round"/>
        <path d="M20.1 22h7.5M20.1 25.6h5.9"
              fill="none" stroke="${color}" stroke-width="1.7"
              stroke-linecap="round"/>
        <text x="20.2" y="32.3"
              font-family="Arial,Helvetica,sans-serif"
              font-size="10.4"
              font-weight="700"
              fill="${color}">₹</text>
        <circle cx="34.2" cy="34.3" r="5.4"
                fill="#ffffff" stroke="${color}" stroke-width="1.75"/>
        <path d="M34.2 31.2v3.4l2.2 1.35"
              fill="none" stroke="${color}" stroke-width="1.55"
              stroke-linecap="round" stroke-linejoin="round"/>
    ${commonEnd}`;

    const svg = kind === 'paymentReceipt' ? paymentSvg : invoiceSvg;

    return `<img
        src="${svgDataUri(svg)}"
        alt=""
        width="${size}"
        height="${size}"
        style="display:block;width:${size}px;height:${size}px;border:0;outline:none;"
    />`;
}

function downloadCard(title, text, url, color, iconKind) {
    return `
        <div style="padding:3px 1.6px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td width="48" valign="top">
                        ${downloadIcon(iconKind, color, 33)}
                    </td>
                    <td valign="top" style="padding-left:7.8px;">
                        <div style="font-size:9.3px;font-weight:800;color:${color};text-transform:uppercase;margin-bottom:4px;">${esc(title)}</div>
                        <div style="font-size:8.5px;line-height:1.35;color:#333b55;margin-bottom:6.2px;">${esc(text)}</div>
                        <a href="${esc(url || '#')}"
                           style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:7.8px;font-weight:800;padding:6.2px 11.6px;border-radius:3px;text-transform:uppercase;">
                            ↓ &nbsp; DOWNLOAD
                        </a>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

class EmailTemplateGenerator {
    async getTemplate(formType) {
        if (!formType) return null;
        return MessageTemplate.findOne({ formType }).lean();
    }

    resolvePlaceholderValue(key, data = {}) {
        const aliases = {
            NAME: data.fullName || data.name || [data.firstName, data.lastName].filter(Boolean).join(' '),
            REG_ID: data.registrationId || data.regId,
            REGISTRATION_ID: data.registrationId || data.regId,
            COMPANY: data.companyName || data.company || data.organization || data.organizationName,
            EXHIBITOR_NAME: data.exhibitorName || data.exhibitor_name || data.companyName || data.name,
            CONTACT_PERSON: data.contactPerson || data.contact_person || data.contact1?.name,
            EMAIL: data.email || data.officialEmail || data.contact1?.email,
            PHONE: data.phone || data.mobile || data.mobileNumber || data.contact1?.mobile,
            MOBILE: data.mobile || data.phone || data.mobileNumber || data.contact1?.mobile,
            EVENT_NAME: data.eventName || data.event_name,
            STALL_NO: data.stallNo || data.stall_no || data.stallFor,
            TOTAL_AMOUNT: data.totalAmount || data.total_amount,
            AMOUNT_PAID: data.amountPaid || data.amount_paid,
            BALANCE_DUE: data.balanceDue || data.balance_due,
            PAYMENT_STATUS: data.paymentStatus || data.payment_status,
            PAYMENT_MODE: data.paymentMode || data.payment_mode,
            PAYMENT_METHOD: data.paymentMethod || data.payment_method,
            TRANSACTION_ID: data.transactionId || data.transaction_id,
            ORDER_NO: data.orderNo || data.order_no,
            GRAND_TOTAL: data.grandTotal || data.grand_total
        };

        const upperKey = String(key || '').toUpperCase();
        if (aliases[upperKey] !== undefined && aliases[upperKey] !== '') return aliases[upperKey];

        const cleanUpperKey = upperKey.replace(/_/g, '');
        for (const [dataKey, value] of Object.entries(data)) {
            if (String(dataKey).toUpperCase().replace(/_/g, '') === cleanUpperKey) {
                return value;
            }
        }

        return null;
    }

    applyPlaceholders(content, data = {}) {
        if (!content) return '';
        return String(content).replace(/\[\[\s*([a-zA-Z0-9_]+)\s*\]\]/g, (match, key) => {
            const value = this.resolvePlaceholderValue(key, data);
            return value === null || value === undefined ? match : String(value);
        });
    }

    buildTemplateAssets(template = {}) {
        const attachments = [];

        // Default IHWE header image.
        // If MessageTemplate has its own headerImage, that will still take priority.
        const headerImagePath = template.headerImage || 'utils/images/amann.png';

        const headerAttachment = getImageAttachment(headerImagePath, 'email_header_img', 'header');
        const footerAttachment = getImageAttachment(template.footerImage, 'email_footer_img', 'footer');
        const smallLogoAttachment = getImageAttachment(template.smallLogo, 'email_small_logo_img', 'small-logo');

        if (headerAttachment) attachments.push(headerAttachment);
        if (footerAttachment) attachments.push(footerAttachment);
        if (smallLogoAttachment) attachments.push(smallLogoAttachment);

        return {
            attachments,
            headerCid: headerAttachment ? 'email_header_img' : null,
            footerCid: footerAttachment ? 'email_footer_img' : null,
            smallLogoCid: smallLogoAttachment ? 'email_small_logo_img' : null
        };
    }

    normalizeIHWEConfirmationData(data = {}) {
        const contact1 = data.contact1 || {};
        const participation = data.participation || {};
        const finance = data.financeBreakdown || data.finance || {};
        const latestPayment = getLatestPayment(data);
        const amountPaid = getPaidAmount(data);
        const totalAmount = pickNumber(data, [
            'bookingAmount',
            'invoiceAmount',
            'totalAmount',
            'totalPayable',
            'grandTotal',
            'finalAmount',
            'financeBreakdown.grandTotal',
            'financeBreakdown.total',
            'financeBreakdown.netPayable',
            'financeBreakdown.totalAmount'
        ], 0);
        const netPayable = pickNumber(data, [
            'netPayable',
            'totalPayable',
            'financeBreakdown.netPayable',
            'financeBreakdown.grandTotal',
            'financeBreakdown.totalPayable'
        ], totalAmount);
        const balanceDue = pickNumber(data, ['balanceDue', 'balanceAmount'], Math.max(0, netPayable - amountPaid));

        return {
            ...data,
            clientName: pickValue(data, [
                'clientName',
                'contactPerson',
                'contact1.name'
            ], fullName(contact1.firstName, contact1.lastName) || data.name || 'Client'),
            companyName: pickValue(data, [
                'companyName',
                'exhibitorName',
                'organizationName',
                'companyFirmName'
            ], '—'),
            eventName: pickValue(data, [
                'eventName',
                'event.name',
                'eventId.name',
                'eventTitle'
            ], '9th International Health & Wellness Expo 2026 – Global Edition'),
            proformaInvoiceNo: pickValue(data, [
                'proformaInvoiceNo',
                'proformaNo',
                'estimate_no',
                'est_no',
                'pi_no',
                'invoiceNo',
                'invoice_no',
                'registrationId'
            ], '—'),
            bookingAmount: totalAmount,
            invoiceAmount: totalAmount,
            netPayable,
            amountPaid,
            balanceDue,
            tdsDeducted: pickNumber(data, ['tdsDeducted', 'tdsAmount', 'financeBreakdown.tdsDeducted'], 0),
            paymentStatus: pickValue(data, ['paymentStatus', 'status'], balanceDue > 0 ? 'PARTIAL' : 'PAID'),
            paymentDate: pickValue(data, ['paymentDate', 'paidAt'], latestPayment.paidAt || latestPayment.date || latestPayment.createdAt || ''),
            installments: normalizeInstallments(data),
            stallNo: pickValue(data, [
                'stallNo',
                'stall_no',
                'participation.stallFor',
                'participation.stallNo',
                'stallNumber'
            ], '—'),
            hallNo: pickValue(data, [
                'hallNo',
                'hall_no',
                'participation.hallNo',
                'hallNumber'
            ], '12'),
            stallSize: pickValue(data, [
                'stallSize',
                'stall_size',
                'participation.stallSize',
                'participation.size',
                'dimension'
            ], '—'),
            stallType: pickValue(data, [
                'stallType',
                'stall_type',
                'participation.stallType',
                'stallScheme'
            ], '—'),
            stallPosition: pickValue(data, [
                'stallPosition',
                'stall_position',
                'participation.stallPosition',
                'participation.openSides'
            ], '—'),
            floorPlanReference: pickValue(data, [
                'floorPlanReference',
                'floorPlanRef',
                'participation.floorPlanReference'
            ], '—'),
            dashboardUsername: pickValue(data, ['dashboardUsername', 'username', 'loginUsername', 'contact1.email', 'companyEmail'], ''),
            temporaryPassword: pickValue(data, ['temporaryPassword', 'password', 'rawPassword'], ''),
            relationshipManager: {
                ...(data.relationshipManager || {}),
                name: pickValue(data, ['relationshipManager.name', 'rmName', 'relationshipManagerName'], data.relationshipManager?.name || 'Mr. Vimal Chopra'),
                phone: pickValue(data, ['relationshipManager.phone', 'rmPhone', 'relationshipManagerMobile'], data.relationshipManager?.phone || '+91 96549 00525'),
                email: pickValue(data, ['relationshipManager.email', 'rmEmail'], data.relationshipManager?.email || 'crm@namogangewellness.com')
            },
            accountsSupport: data.accountsSupport || {},
            exhibitorHelpline: data.exhibitorHelpline || {},
            finance
        };
    }

    /**
     * Exact compact IHWE 2026 exhibitor confirmation layout.
     *
     * IMPORTANT:
     * - Header/footer should be uploaded on the MessageTemplate record.
     * - Those images are embedded as CID attachments, so Gmail/Outlook render them reliably.
     * - Body uses email-safe tables + inline CSS; no flex/grid dependency.
     * - There is no internal scrollbar and no horizontal overflow.
     */
    buildIHWEConfirmationBody(data = {}) {
        data = this.normalizeIHWEConfirmationData(data);
        const eventName = data.eventName || '9th International Health & Wellness Expo 2026 – Global Edition';
        const clientName = data.clientName || data.contactPerson || data.name || '[Client Name]';
        const companyName = data.companyName || data.exhibitorName || data.organizationName || '—';

        const installments = safeArray(data.installments, [
            {
                label: '1st Installment (Paid)',
                dueDate: data.firstInstallmentDate || data.paymentDate || '08 Aug 2026',
                amount: data.amountPaid || 40000,
                status: 'PAID'
            },
            {
                label: '2nd Installment',
                dueDate: data.secondInstallmentDate || '20 Aug 2026',
                amount: data.secondInstallmentAmount || 38410,
                status: 'PENDING'
            },
            {
                label: '3rd Installment',
                dueDate: data.thirdInstallmentDate || '05 Sep 2026',
                amount: data.thirdInstallmentAmount || 38410,
                status: 'PENDING'
            }
        ]);

        const installmentRows = installments.map((item, index) => {
            const paid = String(item.status || '').toUpperCase() === 'PAID';
            return `
                <tr>
                    <td style="padding:6.2px 4.7px;border:1px solid #dbe1ef;font-size:7.8px;line-height:1.25;font-weight:${index === 0 ? '700' : '600'};color:#1e2542;text-align:center;">
                        ${esc(item.label || `Installment ${index + 1}`)}
                    </td>
                    <td style="padding:6.2px 4px;border:1px solid #dbe1ef;font-size:7.8px;color:#1e2542;text-align:center;white-space:nowrap;">
                        ${fmtDate(item.dueDate, item.dueDate || '—')}
                    </td>
                    <td style="padding:6.2px 4px;border:1px solid #dbe1ef;font-size:7.8px;color:#1e2542;text-align:center;white-space:nowrap;">
                        ${money(item.amount)}
                    </td>
                    <td style="padding:6.2px 4px;border:1px solid #dbe1ef;font-size:7.8px;font-weight:800;text-align:center;color:${paid ? '#14813a' : '#f04a1e'};">
                        ${esc(item.status || 'PENDING')}
                    </td>
                </tr>
            `;
        }).join('');

        const stallInclusions = safeArray(data.shellSchemeInclusions, [
            'Fascia Name Board',
            'Carpet',
            '3 Spot Lights',
            '1 Table',
            '2 Chairs',
            '1 Power Point',
            'Dustbin'
        ]);

        const passes = safeArray(data.exhibitorPasses, [
            '10 Visitor Passes',
            '2 Exhibitor Passes',
            '4 Service Passes',
            '2 Vehicle Passes'
        ]);

        const hospitality = safeArray(data.hospitality, [
            '2 Lunches + 2 Water Bottles per day for all 3 days of the event.'
        ]);

        const relationshipManager = data.relationshipManager || {};
        const accountsSupport = data.accountsSupport || {};
        const exhibitorHelpline = data.exhibitorHelpline || {};

        return `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#171d3d;background:#fff;">
            <!-- Greeting -->
            <div style="padding:23.3px 14px 4.7px 14px;">
                <div style="font-size:14px;line-height:1.25;font-weight:800;color:#1735aa;margin:0 0 7px 0;">
                    Dear ${esc(clientName)}, <span style="color:#f04a1e;">Namo Gange Namaskar!</span>
                </div>

                <div style="font-size:9.3px;line-height:1.48;color:#17203e;">
                    <p style="margin:0 0 6.2px 0;">
                        We are pleased to confirm your participation in the <strong>${esc(eventName)}</strong>.
                    </p>
                    <p style="margin:0 0 6.2px 0;">
                        Your booking amount has been received successfully. You have opted for the installment plan and your
                        <strong>${esc(String(installments.length))} installment(s)</strong> are pending as per the schedule given in the summary below.
                        We sincerely thank you for your trust and continued association with us.
                    </p>
                    <p style="margin:0 0 6.2px 0;">
                        IHWE 2026 is India’s most impactful health &amp; wellness platform, bringing together global exhibitors, healthcare professionals,
                        industry leaders, buyers and thought leaders on one dynamic platform to collaborate, innovate and create lasting impact.
                    </p>
                    <p style="margin:0 0 6.2px 0;">
                        We are committed to delivering an exceptional experience and ensuring you achieve the best possible outcomes through
                        meaningful business connections, brand visibility and knowledge exchange.
                    </p>
                    <p style="margin:0 0 7px 0;font-weight:700;">
                        We look forward to welcoming your esteemed organization to Pragati Maidan, New Delhi, from 21 – 23 August 2026.
                    </p>
                </div>
            </div>

            <!-- 1. Booking & Payment Summary -->
            <div style="padding:0 11px 6.2px 11px;">
                <div style="border:1px solid #d7deee;border-radius:4.7px;overflow:hidden;background:#fff;">
                    ${sectionHeader('1', 'BOOKING & PAYMENT SUMMARY', '#1635aa')}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        style="border-collapse:collapse;">
                        <tr>
                            <!-- Left summary -->
                            <td width="36%" valign="top" style="padding:6.2px 9.3px;border-right:1px dotted #cfd6e7;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                    style="border-collapse:collapse;">
                                    ${infoRows([
                                        ['Company Name', `<strong>${esc(companyName)}</strong>`],
                                        ['Proforma Invoice No.', esc(data.proformaInvoiceNo || data.invoiceNo || '—')],
                                        ['Booking / Invoice Amount', money(data.bookingAmount || data.invoiceAmount || data.totalAmount)],
                                        ['TDS Deducted (as applicable)', money(data.tdsDeducted || 0)],
                                        ['Net Payable Amount', `<strong style="font-size:11px;color:#1635aa;">${money(data.netPayable || data.totalAmount)}</strong>`],
                                        ['Booking Amount Received', `<strong style="font-size:11px;color:#14813a;">${money(data.amountPaid)}</strong>`],
                                        ['Balance Amount', `<strong style="font-size:11px;color:#f04a1e;">${money(data.balanceDue)}</strong>`],
                                        ['Payment Status', `<strong style="color:#f04a1e;">${esc(data.paymentStatus || 'PARTIAL')}</strong>`],
                                        ['Payment Date', fmtDate(data.paymentDate)]
                                    ], { labelWidth: 51 })}
                                </table>
                            </td>

                            <!-- Center installment schedule -->
                            <td width="39%" valign="top" style="padding:6.2px 9.3px;border-right:1px dotted #cfd6e7;">
                                <div style="font-size:9.3px;font-weight:800;color:#1735aa;text-transform:uppercase;margin:0 0 6.2px 0;">
                                    INSTALLMENT SCHEDULE
                                </div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                    style="border-collapse:collapse;">
                                    <tr style="background:#f4f6fb;">
                                        <th style="padding:5.4px 4px;border:1px solid #dbe1ef;font-size:7px;color:#202742;">Installment</th>
                                        <th style="padding:5.4px 4px;border:1px solid #dbe1ef;font-size:7px;color:#202742;">Due Date</th>
                                        <th style="padding:5.4px 4px;border:1px solid #dbe1ef;font-size:7px;color:#202742;">Amount (₹)</th>
                                        <th style="padding:5.4px 4px;border:1px solid #dbe1ef;font-size:7px;color:#202742;">Status</th>
                                    </tr>
                                    ${installmentRows}
                                </table>
                                <div style="font-size:7.8px;line-height:1.35;font-weight:700;color:#e8332a;margin-top:5.4px;">
                                    Note: Please make the pending payment(s) on or before the due date to avoid late payment charges and ensure smooth participation.
                                </div>
                            </td>

                            <!-- Right downloads -->
                            <td width="25%" valign="top" style="padding:6.2px 9.3px;">
                                ${downloadCard(
                                    'PROFORMA INVOICE',
                                    'You can download your Proforma Invoice for future reference.',
                                    data.proformaInvoiceUrl,
                                    '#1635aa',
                                    'invoice'
                                )}
                                <div style="border-top:1px dotted #cfd6e7;margin:7px 0;"></div>
                                ${downloadCard(
                                    'PAYMENT RECEIPT',
                                    'You can download your Payment Receipt for future reference.',
                                    data.paymentReceiptUrl,
                                    '#0c7b31',
                                    'paymentReceipt'
                                )}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- 2. Stall details -->
            <div style="padding:0 11px 6.2px 11px;">
                <div style="border:1px solid #d7e7dc;border-radius:4.7px;overflow:hidden;background:#fff;">
                    ${sectionHeader('2', 'STALL DETAILS & INCLUSIONS', '#0c7b31')}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        style="border-collapse:collapse;">
                        <tr>
                            <td width="28%" valign="top" style="padding:6.2px 9.3px;border-right:1px dotted #cfd6e7;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                    style="border-collapse:collapse;">
                                    ${infoRows([
                                        ['Stall No.', esc(data.stallNo || '—')],
                                        ['Hall No.', esc(data.hallNo || '12')],
                                        ['Stall Size', esc(data.stallSize || '—')],
                                        ['Stall Type', esc(data.stallType || '—')],
                                        ['Stall Position', `<strong style="color:#0c7b31;">${esc(data.stallPosition || '—')}</strong>`],
                                        ['Floor Plan Reference', esc(data.floorPlanReference || data.floorPlanRef || '—')]
                                    ], { labelWidth: 43 })}
                                </table>
                            </td>

                            <td width="36%" valign="top" style="padding:6.2px 9.3px;border-right:1px dotted #cfd6e7;">
                                <div style="font-size:9.3px;font-weight:800;color:#0c7b31;margin-bottom:5.4px;">
                                    SHELL SCHEME INCLUSIONS (${esc(data.stallSize || '9 SQ. MTR.')})
                                </div>
                                ${bulletList(stallInclusions, 2)}
                                <div style="height:1px;background:#d9e2dc;margin:6.2px 0;"></div>
                                <div style="font-size:9.3px;font-weight:800;color:#0c7b31;margin-bottom:4.7px;">EXHIBITOR HOSPITALITY</div>
                                ${bulletList(hospitality)}
                            </td>

                            <td width="36%" valign="top" style="padding:6.2px 9.3px;">
                                <div style="font-size:9.3px;font-weight:800;color:#0c7b31;margin-bottom:5.4px;">
                                    EXHIBITOR PASSES (As per booked package)
                                </div>
                                ${bulletList(passes, 2)}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- 3 & 4 side-by-side -->
            <div style="padding:0 11px 6.2px 11px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                    style="border-collapse:separate;border-spacing:0;">
                    <tr>
                        <td width="65%" valign="top" style="padding-right:4px;">
                            <div style="border:1px solid #e1d9f2;border-radius:4.7px;padding:7px 9.3px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td valign="top">
                                            <div style="font-size:11.6px;font-weight:800;color:#5020b4;margin-bottom:1.6px;">
                                                3.&nbsp;&nbsp;18<sup>TH</sup> INTEGRATED AROGYA SANGHOSHTHI
                                            </div>
                                            <div style="font-size:7.8px;font-weight:700;color:#5020b4;margin-bottom:5.4px;">
                                                21 – 23 August 2026 &nbsp; | &nbsp; Pragati Maidan
                                            </div>
                                            <div style="font-size:8.5px;line-height:1.42;color:#252c48;">
                                                A three-day premier knowledge platform featuring 3 sessions per day and 30–45 renowned speakers including
                                                Doctors, Researchers, Academicians, AYUSH Experts, Industry Leaders and Students.
                                            </div>
                                            <div style="font-size:8.5px;line-height:1.42;color:#252c48;margin-top:4.7px;">
                                                The platform fosters insightful discussions, knowledge exchange and innovation across healthcare, AYUSH, wellness and preventive health.
                                            </div>
                                        </td>
                                        <td width="34%" valign="top" style="padding-left:9.3px;border-left:1px dotted #d6cce9;">
                                            <div style="font-size:9.3px;font-weight:800;color:#5020b4;margin-bottom:4.7px;">REGISTER DELEGATES</div>
                                            <div style="font-size:8.5px;line-height:1.42;color:#353b52;margin-bottom:7px;">
                                                Secure your seat and participate in insightful sessions, earn certificates with experts and peers from across the globe.
                                            </div>
                                            ${actionButton('REGISTER NOW', data.arogyaRegistrationUrl, '#6a20c5')}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>

                        <td width="35%" valign="top" style="padding-left:4px;">
                            <div style="border:1px solid #f3ddd6;border-radius:4.7px;padding:7px 9.3px;">
                                <div style="font-size:11.6px;font-weight:800;color:#ec4b20;margin-bottom:4.7px;">
                                    4.&nbsp;&nbsp;BUYER–SELLER MEET <span style="font-size:6.2px;">(2<sup>ND</sup> EDITION)</span>
                                </div>
                                <div style="font-size:8.5px;line-height:1.42;color:#353b52;">
                                    Connect with International &amp; Domestic Buyers, Distributors, Importers, Exporters, Institutional Buyers and Industry Decision Makers in pre-scheduled B2B meetings.
                                </div>
                                <div style="font-size:8.5px;line-height:1.42;color:#353b52;margin:4.7px 0 7px 0;">
                                    This is your opportunity to showcase your products, expand your reach, build strong business relationships and explore new markets.
                                </div>
                                ${actionButton('REGISTER NOW', data.buyerSellerRegistrationUrl, '#f04a1e')}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- 5. Dashboard -->
            <div style="padding:0 11px 6.2px 11px;">
                <div style="border:1px solid #d7deee;border-radius:4.7px;padding:7px 9.3px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td width="40%" valign="top">
                                <div style="font-size:11.6px;font-weight:800;color:#1735aa;margin-bottom:4px;">
                                    5.&nbsp;&nbsp;EXHIBITOR DASHBOARD ACCESS
                                </div>
                                <div style="font-size:8.5px;line-height:1.42;color:#353b52;">
                                    Your one-stop platform to manage your profile, passes, documents, service requests and all event-related activities conveniently.
                                    Log in to access all essential tools and stay updated throughout the event journey.
                                </div>
                            </td>
                            <td width="37%" valign="top" style="padding-left:9.3px;border-left:1px dotted #cfd6e7;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                                    style="border-collapse:collapse;">
                                    ${infoRows([
                                        ['Dashboard URL', `<a href="${esc(data.dashboardUrl || 'https://exhibitor.ihwe.in/login')}" style="color:#1735aa;font-weight:700;text-decoration:none;">${esc(data.dashboardUrl || 'https://exhibitor.ihwe.in/login')}</a>`],
                                        ['Username', `<strong style="color:#1735aa;">${esc(data.dashboardUsername || data.username || '[username]')}</strong>`],
                                        ['Temporary Password', `<strong style="color:#1735aa;">${esc(data.temporaryPassword || data.password || '[password]')}</strong>`]
                                    ], { labelWidth: 43 })}
                                </table>
                                <div style="font-size:7px;color:#5e6578;margin-top:4px;">(Please change your password after first login)</div>
                            </td>
                            <td width="23%" valign="middle" align="center" style="padding-left:9.3px;border-left:1px dotted #cfd6e7;">
                                ${actionButton('LOGIN TO DASHBOARD', data.dashboardUrl || 'https://exhibitor.ihwe.in/login', '#1735aa')}
                                <div style="font-size:7.8px;line-height:1.35;color:#1735aa;font-weight:700;margin-top:5.4px;">
                                    All your event essentials<br>in one place.
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- 6. Support team -->
            <div style="padding:0 11px 6.2px 11px;">
                <div style="border:1px solid #d7e7dc;border-radius:4.7px;padding:7px 9.3px;">
                    <div style="font-size:11.6px;font-weight:800;color:#14786c;margin-bottom:6.2px;">
                        6.&nbsp;&nbsp;YOUR RELATIONSHIP &amp; SUPPORT TEAM
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td width="25%" valign="top" style="padding-right:7px;border-right:1px dotted #cfd6e7;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td valign="top" style="padding-right:6.2px;">${iconImg('user', 28)}</td>
                                        <td valign="top">
                                            <div style="font-size:7.8px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:4px;">RELATIONSHIP MANAGER</div>
                                            <div style="font-size:8.5px;line-height:1.38;color:#28304d;">
                                                ${esc(relationshipManager.name || 'Mr. Vimal Chopra')}<br>
                                                ${esc(relationshipManager.phone || '+91 96549 00525')}<br>
                                                ${esc(relationshipManager.email || 'crm@namogangewellness.com')}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="25%" valign="top" style="padding:0 7px;border-right:1px dotted #cfd6e7;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td valign="top" style="padding-right:6.2px;">${iconImg('accounts', 28)}</td>
                                        <td valign="top">
                                            <div style="font-size:7.8px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:4px;">ACCOUNTS SUPPORT</div>
                                            <div style="font-size:8.5px;line-height:1.38;color:#28304d;">
                                                ${esc(accountsSupport.phone || '+91 99534 56789')}<br>
                                                ${esc(accountsSupport.email || 'accounts@namogangewellness.com')}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="25%" valign="top" style="padding:0 7px;border-right:1px dotted #cfd6e7;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td valign="top" style="padding-right:6.2px;">${iconImg('headset', 28)}</td>
                                        <td valign="top">
                                            <div style="font-size:7.8px;font-weight:800;color:#14786c;text-transform:uppercase;line-height:1.2;margin-bottom:4px;">EXHIBITOR HELPLINE</div>
                                            <div style="font-size:8.5px;line-height:1.38;color:#28304d;">
                                                ${esc(exhibitorHelpline.phone || '+91 96549 00525')}<br>
                                                ${esc(exhibitorHelpline.email || 'expo@namogangewellness.com')}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="25%" valign="top" style="padding-left:7.8px;text-align:center;">
                                <div style="font-size:7.8px;line-height:1.35;color:#41485e;">
                                    For stall, passes, services or any event-related assistance, please contact your Relationship Manager.
                                </div>
                                <div style="font-size:8.5px;line-height:1.35;color:#14786c;font-weight:800;margin-top:4px;">
                                    We are committed to making your participation seamless and successful!
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Bottom footer row -->
            <div style="padding:0 11px 11px 11px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <tr>
                        <td width="73%" valign="middle" style="padding:6.2px 3px 0 3px;white-space:nowrap;">
                            <span style="font-size:8.5px;font-weight:800;color:#1735aa;text-transform:uppercase;">HEAD OFFICE:</span>
                            <span style="font-size:7.8px;line-height:1.3;color:#28304d;margin-left:5.4px;">
                                ${esc(data.headOfficeText || 'Namo Gange Wellness Pvt. Ltd., 608, 6th Floor, Pearls Best Heights–II, Netaji Subhash Place, Pitampura, New Delhi – 110034, India')}
                            </span>
                        </td>
                        <td width="27%" valign="middle" align="right" style="padding:6.2px 3px 0 3px;white-space:nowrap;">
                            <span style="font-size:8.5px;font-weight:800;color:#1f2848;text-transform:uppercase;margin-right:5.4px;">FOLLOW US ON:</span>
                            <a href="${esc(data.facebookUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:3px;">${iconImg('facebook', 14)}</a>
                            <a href="${esc(data.instagramUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:3px;">${iconImg('instagram', 14)}</a>
                            <a href="${esc(data.linkedinUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:3px;">${iconImg('linkedin', 14)}</a>
                            <a href="${esc(data.youtubeUrl || '#')}" style="display:inline-block;vertical-align:middle;margin-left:3px;">${iconImg('youtube', 14)}</a>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        `;
    }

    async generateFromTemplate(formType, data = {}, options = {}) {
        const template = await this.getTemplate(formType);
        if (!template) {
            throw new Error(`Email template not found: ${formType}`);
        }

        const subject = this.applyPlaceholders(template.emailSubject, data);
        const assets = this.buildTemplateAssets(template);

        const useIHWELayout =
            options.layout === 'ihwe-confirmation' ||
            formType === 'exhibitor_booking_confirmation';

        let body;

        if (useIHWELayout) {
            body = this.buildIHWEConfirmationBody(data);
        } else {
            body = this.applyPlaceholders(template.emailBody, data);

            if (assets.smallLogoCid) {
                body += `<div style="text-align:left;margin-top:15.5px;padding-top:15.5px;border-top:1px solid #eeeeee;">
                    <img src="cid:${assets.smallLogoCid}" alt="Logo" width="150"
                        style="display:block;max-width:116.3px;height:auto;border:0;" />
                </div>`;
            }
        }

        const html = emailShell(body, {
            headerImage: template.headerImage || 'utils/images/amann.png',
            footerImage: template.footerImage,
            headerCid: assets.headerCid,
            footerCid: assets.footerCid,
            padding: useIHWELayout ? 0 : options.padding,
            hideFallbackFooter: useIHWELayout ? true : options.hideFallbackFooter,
            compactFooter: options.compactFooter,
            maxWidth: useIHWELayout ? 794 : options.maxWidth
        });

        return {
            subject,
            body,
            html,
            attachments: [...assets.attachments, ...(options.attachments || [])],
            template
        };
    }

    /**
     * Direct helper if you do not want to depend on a specific formType.
     * Pass a MessageTemplate-compatible object containing headerImage/footerImage.
     */
    generateIHWEConfirmation({ subject = '', data = {}, template = {}, options = {} }) {
        const assets = this.buildTemplateAssets(template);
        const renderedSubject = this.applyPlaceholders(subject, data);
        const body = this.buildIHWEConfirmationBody(data);

        return {
            subject: renderedSubject,
            body,
            html: emailShell(body, {
                headerImage: template.headerImage || 'utils/images/amann.png',
                footerImage: template.footerImage,
                headerCid: assets.headerCid,
                footerCid: assets.footerCid,
                padding: 0,
                hideFallbackFooter: true,
                compactFooter: true,
                maxWidth: options.maxWidth || 794
            }),
            attachments: [...assets.attachments, ...(options.attachments || [])]
        };
    }

    generateCustomTemplate({
        subject = '',
        body = '',
        data = {},
        headerImage = null,
        footerImage = null,
        smallLogo = null,
        options = {}
    }) {
        const template = { headerImage, footerImage, smallLogo };
        const renderedSubject = this.applyPlaceholders(subject, data);
        let renderedBody = this.applyPlaceholders(body, data);
        const assets = this.buildTemplateAssets(template);

        if (assets.smallLogoCid) {
            renderedBody += `<div style="text-align:left;margin-top:15.5px;padding-top:15.5px;border-top:1px solid #eeeeee;">
                <img src="cid:${assets.smallLogoCid}" alt="Logo" width="150"
                    style="display:block;max-width:116.3px;height:auto;border:0;" />
            </div>`;
        }

        return {
            subject: renderedSubject,
            body: renderedBody,
            html: emailShell(renderedBody, {
                headerImage,
                footerImage,
                headerCid: assets.headerCid,
                footerCid: assets.footerCid,
                padding: options.padding,
                hideFallbackFooter: options.hideFallbackFooter,
                compactFooter: options.compactFooter,
                maxWidth: options.maxWidth
            }),
            attachments: [...assets.attachments, ...(options.attachments || [])]
        };
    }
}

module.exports = new EmailTemplateGenerator();
