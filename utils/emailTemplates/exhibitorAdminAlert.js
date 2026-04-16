const getExhibitorAdminAlertTemplate = (data) => {
    const registrationDate = new Date().toLocaleDateString('en-GB');
    const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const cur = data.currency === 'USD' ? '$' : '₹';
    const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 10px;
            -webkit-text-size-adjust: 100%;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%);
            padding: 20px 15px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.4; }
        .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.95; }
        .content { padding: 20px 15px; color: #333; line-height: 1.6; font-size: 14px; }
        .content p { margin: 10px 0; }
        .divider { border-top: 2px solid #e5e7eb; margin: 15px 0; }
        .details-section {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border: 1px solid #e5e7eb;
        }
        .details-section h3 { color: #23471d; margin: 0 0 12px 0; font-size: 15px; font-weight: 700; }
        .details-row {
            display: block;
            margin: 12px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child { border-bottom: none; margin-bottom: 0; }
        .details-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .details-value {
            color: #1f2937;
            font-size: 14px;
            font-weight: 500;
            display: block;
            word-break: break-word;
        }
        .highlight { color: #d26019; font-weight: 700; }
        .amount-box {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        .amount-table { width: 100%; border-collapse: collapse; }
        .amount-table td { padding: 10px 15px; text-align: center; border-right: 1px solid #86efac; }
        .amount-table td:last-child { border-right: none; }
        .amount-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; display: block; margin-bottom: 6px; }
        .amount-value { font-size: 20px; font-weight: 900; color: #23471d; display: block; }
        .amount-value.orange { color: #d26019; }
        .amount-value.red { color: #dc2626; }
        .action-section {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #f59e0b;
        }
        .action-section h3 { color: #92400e; margin: 0 0 10px 0; font-size: 15px; font-weight: 700; }
        .action-section ul { margin: 10px 0; padding-left: 20px; }
        .action-section li { margin: 6px 0; color: #78350f; font-size: 13px; line-height: 1.5; }
        .footer {
            background-color: #111827;
            padding: 15px;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            line-height: 1.6;
        }
        .footer p { margin: 5px 0; }
        @media only screen and (min-width: 600px) {
            body { padding: 20px; }
            .header { padding: 25px 30px; }
            .header h1 { font-size: 22px; }
            .content { padding: 30px; font-size: 15px; }
            .details-section { padding: 20px; }
            .details-section h3 { font-size: 16px; margin-bottom: 15px; }
            .details-row { display: flex; align-items: flex-start; margin: 10px 0; padding: 0; border-bottom: none; }
            .details-label { min-width: 220px; max-width: 220px; font-size: 13px; display: inline-block; margin-bottom: 0; padding-right: 15px; }
            .details-value { font-size: 15px; display: inline-block; flex: 1; }
            .action-section { padding: 20px; }
            .footer { padding: 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Exhibitor Booking Alert | IHWE 2026</h1>
            <p>Reg ID: ${data.registrationId || 'N/A'} &nbsp;|&nbsp; ${registrationDate} at ${registrationTime}</p>
        </div>
        <div class="content">
            <p><strong>Dear Team,</strong></p>
            <p>A new Exhibitor Stall Booking has been successfully received for the <strong>9th International Health &amp; Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>Please find the booking details below for your reference and necessary follow-up:</p>

            <div class="divider"></div>

            <!-- Company Details -->
            <div class="details-section">
                <h3>🏢 Exhibitor Details</h3>
                <div class="details-row">
                    <span class="details-label">Registration ID</span>
                    <span class="details-value highlight">${data.registrationId || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Company Name</span>
                    <span class="details-value">${data.exhibitorName || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Type of Business</span>
                    <span class="details-value">${data.typeOfBusiness || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Industry Sector</span>
                    <span class="details-value">${data.industrySector || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Website</span>
                    <span class="details-value">${data.website || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Address</span>
                    <span class="details-value">${[data.address, data.city, data.state, data.country, data.pincode].filter(Boolean).join(', ') || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">GST No.</span>
                    <span class="details-value">${data.gstNo || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">PAN No.</span>
                    <span class="details-value">${data.panNo || 'N/A'}</span>
                </div>
            </div>

            <!-- Contact Details -->
            <div class="details-section">
                <h3>👤 Contact Person</h3>
                <div class="details-row">
                    <span class="details-label">Name</span>
                    <span class="details-value">${data.contact1Title || ''} ${data.contact1FirstName || ''} ${data.contact1LastName || ''}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Designation</span>
                    <span class="details-value">${data.contact1Designation || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Email</span>
                    <span class="details-value">${data.contact1Email || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Mobile</span>
                    <span class="details-value">${data.contact1Mobile || 'N/A'}</span>
                </div>
            </div>

            <!-- Stall Details -->
            <div class="details-section">
                <h3>🏗️ Stall Details</h3>
                <div class="details-row">
                    <span class="details-label">Stall No.</span>
                    <span class="details-value highlight">${data.stallFor || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Stall Type</span>
                    <span class="details-value">${data.stallType || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Stall Size</span>
                    <span class="details-value">${data.stallSize ? data.stallSize + ' sqm' : 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Dimension</span>
                    <span class="details-value">${data.dimension || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Event</span>
                    <span class="details-value">${data.eventName || 'IHWE 2026'}</span>
                </div>
            </div>

            <!-- Payment Summary -->
            <div class="amount-box">
                <table class="amount-table">
                    <tr>
                        <td>
                            <span class="amount-label">Total Amount</span>
                            <span class="amount-value">${fmt(data.totalAmount)}</span>
                        </td>
                        <td>
                            <span class="amount-label">Amount Paid</span>
                            <span class="amount-value orange">${fmt(data.amountPaid)}</span>
                        </td>
                        <td>
                            <span class="amount-label">Balance Due</span>
                            <span class="amount-value ${data.balanceAmount > 0 ? 'red' : ''}">${fmt(data.balanceAmount)}</span>
                        </td>
                        <td>
                            <span class="amount-label">Payment Mode</span>
                            <span class="amount-value" style="font-size:14px;">${data.paymentMode || 'N/A'}</span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- CRM -->
            <div class="details-section">
                <h3>📊 CRM Info</h3>
                <div class="details-row">
                    <span class="details-label">Referred By</span>
                    <span class="details-value">${data.referredBy || 'Direct'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Spoken With</span>
                    <span class="details-value">${data.spokenWith || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Filled By</span>
                    <span class="details-value">${data.filledBy || 'User'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Status</span>
                    <span class="details-value highlight">${data.status || 'pending'}</span>
                </div>
            </div>

            <div class="action-section">
                <h3>📌 Action Required</h3>
                <ul>
                    <li>Review and approve the exhibitor booking</li>
                    <li>Verify stall allocation and payment details</li>
                    <li>Coordinate with the exhibitor for any pending documents</li>
                    <li>Update booking status in the admin panel</li>
                </ul>
            </div>

            <div class="divider"></div>
            <p><strong>Best Regards,</strong><br>Team IHWE 2026<br>Namo Gange Wellness Pvt. Ltd.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p>
            <p>Namo Gange Wellness Pvt. Ltd.</p>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = { getExhibitorAdminAlertTemplate };
