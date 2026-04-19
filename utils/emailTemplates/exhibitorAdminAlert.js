const getExhibitorAdminAlertTemplate = (data) => {
    const registrationDate = new Date().toLocaleDateString('en-GB');
    const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const cur = data.currency === 'USD' ? '$' : '₹';
    const fmt = (n) => `${cur} ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        table { border-collapse: collapse; }
        .container { width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .section-title { color: #23471d; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .details-table { width: 100%; margin-bottom: 25px; }
        .details-table td { padding: 10px 5px; vertical-align: top; border-bottom: 1px solid #f3f4f6; }
        .label { color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; width: 35%; }
        .value { color: #1f2937; font-size: 15px; font-weight: 500; }
        .highlight { color: #d26019; font-weight: bold; }
        .action-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; }
        .footer { background-color: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
    </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" class="container" style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td class="header" style="background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%); padding: 30px; text-align: center; color: #FFFFFF;">
                            <h1 style="margin: 0; font-size: 24px;">New Exhibitor Booking Alert</h1>
                            <p style="margin: 10px 0 0; opacity: 0.9;">Reg ID: ${data.registrationId || 'N/A'} | ${registrationDate} ${registrationTime}</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td class="content" style="padding: 30px; background-color: #FFFFFF;">
                            <p><strong>Dear Team,</strong></p>
                            <p>A new Exhibitor Stall Booking has been recorded for <strong>IHWE 2026</strong>. Please review the details below:</p>
                            
                            <div class="section-title">🏢 Exhibitor Details</div>
                            <table class="details-table" width="100%">
                                <tr>
                                    <td class="label">Registration ID</td>
                                    <td class="value highlight">${data.registrationId || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td class="label">Company Name</td>
                                    <td class="value">${data.exhibitorName || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td class="label">Industry Sector</td>
                                    <td class="value">${data.industrySector || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td class="label">Address</td>
                                    <td class="value">${[data.address, data.city, data.state, data.country, data.pincode].filter(Boolean).join(', ') || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td class="label">GST / PAN</td>
                                    <td class="value">${data.gstNo || 'N/A'} / ${data.panNo || 'N/A'}</td>
                                </tr>
                            </table>

                            <div class="section-title">👤 Contact Person</div>
                            <table class="details-table" width="100%">
                                <tr>
                                    <td class="label">Name</td>
                                    <td class="value">${data.contact1Title || ''} ${data.contact1FirstName || ''} ${data.contact1LastName || ''}</td>
                                </tr>
                                <tr>
                                    <td class="label">Designation</td>
                                    <td class="value">${data.contact1Designation || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td class="label">Email / Mobile</td>
                                    <td class="value">${data.contact1Email || 'N/A'} / ${data.contact1Mobile || 'N/A'}</td>
                                </tr>
                            </table>

                            <div class="section-title">🏗️ Stall & Payment</div>
                            <table class="details-table" width="100%">
                                <tr>
                                    <td class="label">Stall Info</td>
                                    <td class="value"><strong>Stall ${data.stallFor || 'N/A'}</strong> (${data.stallType || 'N/A'}) - ${data.stallSize || '0'} sqm</td>
                                </tr>
                                <tr>
                                    <td class="label">Total Amount</td>
                                    <td class="value" style="font-weight: bold;">${fmt(data.totalAmount)}</td>
                                </tr>
                                <tr>
                                    <td class="label">Amount Paid</td>
                                    <td class="value" style="color: #16a34a; font-weight: bold;">${fmt(data.amountPaid)}</td>
                                </tr>
                                <tr>
                                    <td class="label">Balance Due</td>
                                    <td class="value" style="color: ${data.balanceAmount > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">${fmt(data.balanceAmount)}</td>
                                </tr>
                                <tr>
                                    <td class="label">Payment Mode</td>
                                    <td class="value">${(data.paymentMode || 'N/A').toUpperCase()}</td>
                                </tr>
                            </table>

                            <div class="action-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px;">
                                <p style="margin: 0; font-weight: bold; color: #92400e; margin-bottom: 10px;">📌 Required Actions:</p>
                                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px;">
                                    <li>Verify stall allocation & documents</li>
                                    <li>Confirm payment via bank/gateway</li>
                                    <li>Approve registration in Admin Panel</li>
                                </ul>
                            </div>

                            <p style="margin-top: 30px;">Best Regards,<br/><strong>Team IHWE</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="footer" style="background-color: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                            <p>&copy; 2026 IHWE | Namo Gange Wellness Pvt. Ltd.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

module.exports = { getExhibitorAdminAlertTemplate };
