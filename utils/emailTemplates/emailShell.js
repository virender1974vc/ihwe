'use strict';

const fs = require('fs');

const emailShell = (body, options = {}) => {
            const { headerCid, footerCid, headerImage, footerImage, padding, hideFallbackFooter, compactFooter } = options;


            const toBase64 = (imgPath) => {
                try {
                    if (!imgPath) return null;
                    const absPath = require('path').resolve(__dirname, '..', '..', imgPath.replace(/^\//, ''));
                    if (!fs.existsSync(absPath)) { console.error('[emailShell] Image not found:', absPath); return null; }
                    const ext = imgPath.split('.').pop().toLowerCase();
                    const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
                    const mime = mimeMap[ext] || 'jpeg';
                    const data = fs.readFileSync(absPath).toString('base64');
                    return `data:image/${mime};base64,${data}`;
                } catch (e) {
                    console.error('[emailShell] toBase64 error:', e.message);
                    return null;
                }
            };

            const headerSrc = headerCid ? `cid:${headerCid}` : toBase64(headerImage);
            const footerSrc = footerCid ? `cid:${footerCid}` : toBase64(footerImage);

            const headerSection = headerSrc
                ? `<tr>
                    <td align="center" style="line-height:0; padding-top: 10px;">
                        <img src="${headerSrc}" alt="Header" width="800" style="display:block; max-width:100%; height:auto; border:0;" />
                    </td>
                   </tr>`
                : `<tr>
                    <td align="center" bgcolor="#23471d" style="background-color: #23471d; padding: 50px 40px 15px 10px;">
                        <!--[if gte mso 9]>
                        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:800px;height:60px;">
                        <v:fill type="solid" color="#23471d" />
                        <v:textbox inset="0,0,0,0">
                        <![endif]-->
                        <div>
                            <h1 style="margin:0; padding:0; font-size: 18px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; font-weight: 600; text-align: center; line-height: 1.1;">9th International Health & Wellness Expo</h1>
                            <p style="margin:3px 0 0; padding:0; font-size: 12px; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; line-height: 1.1; opacity: 0.9;">Global Health Connect | IHWE 2026</p>
                        </div>
                        <!--[if gte mso 9]>
                        </v:textbox>
                        </v:rect>
                        <![endif]-->
                    </td>
                   </tr>`;

            const footerSection = footerSrc
                ? `<tr>
                    <td align="center" style="line-height:0;">
                        <img src="${footerSrc}" alt="Footer" width="800" style="display:block; width:100%; max-width:800px; height:auto; border:0;" />
                    </td>
                   </tr>`
                : (hideFallbackFooter
                    ? ''
                    : `<tr>
                    <td class="email-footer${compactFooter ? ' email-footer-compact' : ''}" bgcolor="${compactFooter ? '#23471d' : '#f9fafb'}" align="center" style="background-color: ${compactFooter ? '#23471d' : '#f9fafb'} !important; padding: ${compactFooter ? '8px 12px' : '20px'}; border-top: 1px solid ${compactFooter ? '#183515' : '#e5e7eb'}; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
                        <p style="margin:0; font-size: ${compactFooter ? '10px' : '13px'}; color: ${compactFooter ? '#ffffff' : '#6b7280'}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: ${compactFooter ? '1.2' : '1.4'}; font-weight:${compactFooter ? '600' : '400'};">&copy; 2026 IHWE. All Rights Reserved.</p>
                        <p style="margin:${compactFooter ? '1px' : '3px'} 0 0; font-size: ${compactFooter ? '9px' : '12px'}; color: ${compactFooter ? '#d9e7d5' : '#9ca3af'}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: ${compactFooter ? '1.2' : '1.4'};">Powered by Namo Gange Wellness Pvt. Ltd.</p>
                    </td>
                   </tr>`);

            return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>IHWE Notification</title>
            <style>
                body { margin: 0; padding: 0; min-width: 100%; background-color: #ffffff; }
                table { border-collapse: collapse; }
                .content-td { padding: 30px 20px; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.7; color: #333333; font-size: 16px; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #23471d; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; margin-top: 15px; }
                .qr-section { text-align: center; margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .content-td { padding: 20px 15px !important; }
                    .registration-info-column { display: block !important; width: 100% !important; padding: 0 0 5px !important; }
                }
                @media print {
                    .email-footer-compact {
                        background: #23471d !important;
                        background-color: #23471d !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .email-footer-compact p:first-child { color: #ffffff !important; }
                    .email-footer-compact p:last-child { color: #d9e7d5 !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <!--[if (gte mso 9)|(IE)]>
                        <table align="center" border="0" cellspacing="0" cellpadding="0" width="800">
                        <tr>
                        <td align="center" valign="top" width="800">
                        <![endif]-->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #eeeeee; max-width: 800px;">
                            ${headerSection}
                            <tr>
                                <td style="padding: ${padding || '30px 20px'}; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.7; color: #333333; font-size: 16px;">
                                    ${body}
                                </td>
                            </tr>
                            ${footerSection}
                        </table>
                        <!--[if (gte mso 9)|(IE)]>
                        </td>
                        </tr>
                        </table>
                        <![endif]-->
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
        };

module.exports = { emailShell };
