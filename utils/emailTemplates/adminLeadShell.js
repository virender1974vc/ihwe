'use strict';

const adminLeadShell = (formType, data) => {
            const fullName = data.name || data.firstName || data.fullName || 'New Lead';
            const email = data.email || data.officialEmail || 'N/A';
            const phone = data.phone || data.mobileNo || data.mobile || 'N/A';
            const subject = data.service || data.proposedTopic || data.topic || 'Inquiry';

            let rows = '';
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value !== 'object' && value !== null && value !== undefined && key !== 'password') {
                    rows += `
                        <tr style="border-bottom: 1px solid #374151;">
                            <td style="padding: 12px 0; color: #9ca3af; font-size: 14px; width: 40%;">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</td>
                            <td style="padding: 12px 0; color: #ffffff; font-size: 15px; font-weight: 500;">${value}</td>
                        </tr>
                    `;
                }
            });

            return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
                    .wrapper { max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
                    .header { background-color: #065f46; padding: 30px; text-align: center; border-bottom: 4px solid #047857; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800; text-transform: uppercase; }
                    .body { padding: 40px; color: #ffffff; }
                    .badge { display: inline-block; background-color: rgba(6, 95, 70, 0.2); color: #34d399; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.2); text-transform: uppercase; }
                    .lead-title { font-size: 20px; font-weight: 700; margin-bottom: 30px; color: #f9fafb; border-bottom: 1px solid #374151; padding-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    .footer { background-color: #000000; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="header">
                        <h1>NEW ${formType.replace('-', ' ').toUpperCase()}</h1>
                    </div>
                    <div class="body">
                        <center><div class="badge">URGENT RESPONSE REQUIRED</div></center>
                        <h2 class="lead-title" style="text-align: center;">Lead Details from ${fullName}</h2>
                        <table>
                            ${rows}
                        </table>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 IHWE | Admin Lead Notification Service</p>
                    </div>
                </div>
            </body>
            </html>
            `;
        }

module.exports = { adminLeadShell };
