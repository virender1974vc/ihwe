'use strict';

async function sendB2BMeetingNotification(data) {
        try {
            const registrationDate = new Date().toLocaleDateString('en-GB');
            const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const interestedSegments = data.areaOfInterest?.join(', ') || 'N/A';
            const purposeOfVisit = data.purposeOfVisit?.join(', ') || 'N/A';

            const subject = `New Visitor Registration Alert | IHWE 2026 | Reg ID: ${data.registrationId}`;

            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                    .header { background-color: #065f46; padding: 25px; text-align: center; color: #ffffff; }
                    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
                    .content { padding: 30px; color: #333333; line-height: 1.6; }
                    .content p { margin: 10px 0; }
                    .divider { border-top: 2px solid #e5e7eb; margin: 20px 0; }
                    .details-section { background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
                    .details-section h3 { color: #065f46; margin-top: 0; font-size: 16px; }
                    .details-row { display: flex; margin: 8px 0; }
                    .details-label { font-weight: 600; color: #4b5563; min-width: 200px; }
                    .details-value { color: #1f2937; }
                    .action-section { background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .action-section h3 { color: #92400e; margin-top: 0; font-size: 16px; }
                    .action-section ul { margin: 10px 0; padding-left: 20px; }
                    .action-section li { margin: 5px 0; color: #78350f; }
                    .footer { background-color: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
                    .footer p { margin: 5px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Visitor Registration Alert | IHWE 2026</h1>
                        <p style="margin: 5px 0 0; font-size: 14px;">Reg ID: ${data.registrationId}</p>
                    </div>
                    <div class="content">
                        <p><strong>Dear Team,</strong></p>
                        <p>This is to inform you that a new Visitor Registration has been successfully received for the <strong>9th International Health & Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
                        <p>Please find the registration details below for your reference and necessary follow-up:</p>
                        
                        <div class="divider"></div>
                        
                        <div class="details-section">
                            <h3>🔹 Visitor Details</h3>
                            <div class="details-row">
                                <span class="details-label">Registration ID:</span>
                                <span class="details-value">${data.registrationId}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Registration Date:</span>
                                <span class="details-value">${registrationDate}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Registration Time:</span>
                                <span class="details-value">${registrationTime}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Name:</span>
                                <span class="details-value">${data.firstName} ${data.lastName}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Category:</span>
                                <span class="details-value">${data.visitorType}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Company Name:</span>
                                <span class="details-value">${data.companyName}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Designation:</span>
                                <span class="details-value">${data.designation}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Email ID:</span>
                                <span class="details-value">${data.email}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Mobile Number:</span>
                                <span class="details-value">${data.mobile}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">City:</span>
                                <span class="details-value">${data.city}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Interested Segments:</span>
                                <span class="details-value">${interestedSegments}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">Purpose of Visit:</span>
                                <span class="details-value">${purposeOfVisit}</span>
                            </div>
                            <div class="details-row">
                                <span class="details-label">B2B Meeting Request:</span>
                                <span class="details-value"><strong>${data.b2bMeeting ? data.b2bMeeting.charAt(0).toUpperCase() + data.b2bMeeting.slice(1) : 'No'}</strong></span>
                            </div>
                        </div>
                        
                        <div class="action-section">
                            <h3>📌 Action Required</h3>
                            <ul>
                                <li>Verify the registration details</li>
                                <li>Ensure confirmation email & QR code has been sent</li>
                                <li>Update the central registration database</li>
                                <li>Assign follow-up (if Corporate Visitor / Buyer)</li>
                            </ul>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p>Please ensure timely action and coordination to maintain seamless visitor management.</p>
                        <p><strong>Best Regards,</strong><br>
                        Team IHWE 2026<br>
                        Namo Gange Wellness Pvt. Ltd.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 IHWE | Global Health Connect. All rights reserved.</p>
                        <p>Namo Gange Wellness Pvt. Ltd.</p>
                    </div>
                </div>
            </body>
            </html>
            `;


            const b2bCoordinatorEmail = process.env.B2B_COORDINATOR_EMAIL || 'vansh.2002cv@gmail.com';

            await this.sendEmail({
                to: b2bCoordinatorEmail,
                subject,
                html,
                profile: 'DEFAULT',
                logData: {
                    name: `${data.firstName} ${data.lastName}`,
                    phone: data.mobile,
                    message: 'B2B Meeting Request Notification'
                }
            });

            console.log(`[B2B Notification] Sent to ${b2bCoordinatorEmail} for ${data.registrationId}`);
            return true;
        } catch (error) {
            console.error('Error sending B2B meeting notification:', error);
            return false;
        }
    }

module.exports = sendB2BMeetingNotification;
