// Mobile-responsive email template for B2B/Buyer interest alerts

const getBuyerInterestAlertTemplate = (data) => {
    const registrationDate = new Date().toLocaleDateString('en-GB');
    const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const interestedSegments = data.areaOfInterest?.join(', ') || 'N/A';
    const businessRequirement = data.specificRequirement || 'Not specified';

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
            -ms-text-size-adjust: 100%;
        }
        .container { 
            max-width: 700px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 20px 15px; 
            text-align: center; 
            color: #ffffff; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 18px; 
            font-weight: 700; 
            line-height: 1.4;
        }
        .header p { 
            margin: 8px 0 0; 
            font-size: 13px; 
            opacity: 0.95;
            word-break: break-all;
        }
        .priority-badge {
            background-color: #fef3c7;
            color: #92400e;
            padding: 8px 15px;
            text-align: center;
            font-weight: 700;
            font-size: 12px;
            border-bottom: 3px solid #f59e0b;
        }
        .content { 
            padding: 20px 15px; 
            color: #333333; 
            line-height: 1.6; 
            font-size: 14px;
        }
        .content p { 
            margin: 10px 0; 
        }
        .divider { 
            border-top: 2px solid #e5e7eb; 
            margin: 15px 0; 
        }
        .details-section { 
            background-color: #f9fafb; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
            border: 1px solid #e5e7eb;
        }
        .details-section h3 { 
            color: #dc2626; 
            margin: 0 0 12px 0;
            font-size: 15px; 
            font-weight: 700;
        }
        .details-row { 
            display: block;
            margin: 12px 0; 
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
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
        .highlight-yes {
            color: #059669;
            font-weight: 700;
            font-size: 16px;
        }
        .action-section { 
            background-color: #fee2e2; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
            border-left: 4px solid #dc2626; 
        }
        .action-section h3 { 
            color: #991b1b; 
            margin: 0 0 10px 0;
            font-size: 15px; 
            font-weight: 700;
        }
        .action-section ul { 
            margin: 10px 0; 
            padding-left: 20px; 
        }
        .action-section li { 
            margin: 6px 0; 
            color: #7f1d1d; 
            font-size: 13px;
            line-height: 1.5;
        }
        .footer { 
            background-color: #111827; 
            padding: 15px; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 11px; 
            line-height: 1.6;
        }
        .footer p { 
            margin: 5px 0; 
        }
        
        /* Tablet and Desktop styles */
        @media only screen and (min-width: 600px) {
            body { padding: 20px; }
            .header { padding: 25px 30px; }
            .header h1 { font-size: 22px; }
            .header p { font-size: 14px; }
            .priority-badge { font-size: 13px; padding: 10px 20px; }
            .content { padding: 30px; font-size: 15px; }
            .details-section { padding: 20px; }
            .details-section h3 { font-size: 16px; margin-bottom: 15px; }
            .details-row { 
                display: flex; 
                align-items: flex-start;
                margin: 10px 0;
                padding: 0;
                border-bottom: none;
            }
            .details-label { 
                min-width: 220px;
                max-width: 220px;
                font-size: 13px;
                display: inline-block;
                margin-bottom: 0;
                padding-right: 15px;
            }
            .details-value { 
                font-size: 15px;
                display: inline-block;
                flex: 1;
            }
            .action-section { padding: 20px; }
            .action-section h3 { font-size: 16px; }
            .action-section li { font-size: 14px; }
            .footer { padding: 20px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Buyer Registration Interest Received | IHWE 2026</h1>
            <p>Reg ID: ${data.registrationId}</p>
        </div>
        <div class="priority-badge">
            🔥 HIGH PRIORITY LEAD - IMMEDIATE ACTION REQUIRED
        </div>
        <div class="content">
            <p><strong>Dear Team,</strong></p>
            <p>This is to inform you that a <strong>Corporate Visitor has expressed interest in Buyer Registration</strong> for the <strong>9th International Health & Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
            <p>Please find the details below for <strong>immediate follow-up and conversion</strong>:</p>
            
            <div class="divider"></div>
            
            <div class="details-section">
                <h3>🔹 Visitor Details</h3>
                <div class="details-row">
                    <span class="details-label">Registration ID</span>
                    <span class="details-value">${data.registrationId}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Registration Date</span>
                    <span class="details-value">${registrationDate}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Registration Time</span>
                    <span class="details-value">${registrationTime}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Name</span>
                    <span class="details-value">${data.firstName} ${data.lastName}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Company Name</span>
                    <span class="details-value">${data.companyName}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Designation</span>
                    <span class="details-value">${data.designation}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Email ID</span>
                    <span class="details-value">${data.email}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Mobile Number</span>
                    <span class="details-value">${data.mobile}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">City</span>
                    <span class="details-value">${data.city}</span>
                </div>
            </div>

            <div class="details-section">
                <h3>🔹 Buyer Interest Details</h3>
                <div class="details-row">
                    <span class="details-label">Interested in Buyer Registration</span>
                    <span class="details-value highlight-yes">✅ YES</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Preferred Segments</span>
                    <span class="details-value">${interestedSegments}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Business Requirement (if any)</span>
                    <span class="details-value">${businessRequirement}</span>
                </div>
            </div>
            
            <div class="action-section">
                <h3>📌 Action Required (High Priority)</h3>
                <ul>
                    <li><strong>Contact the visitor within 24 hours</strong></li>
                    <li>Share Buyer Registration link & benefits</li>
                    <li>Assist in completing Buyer Registration</li>
                    <li>Schedule B2B meetings (if applicable)</li>
                    <li>Update status in CRM / database</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <p>Please treat this as a <strong>priority lead</strong> and ensure timely follow-up to maximize conversion and business engagement.</p>
            <p>For any clarification, feel free to connect.</p>
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
};

module.exports = { getBuyerInterestAlertTemplate };
