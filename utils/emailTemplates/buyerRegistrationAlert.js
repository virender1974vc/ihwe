/**
 * Professional Buyer Registration Alert Template for Admin
 * Mobile-responsive, high-impact design matching IHWE 2026 aesthetics.
 */

const getBuyerRegistrationAlertTemplate = (data) => {
    const registrationDate = new Date().toLocaleDateString('en-GB');
    const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Formatting multi-select array fields
    const formatArray = (arr) => {
        if (!arr) return 'N/A';
        if (Array.isArray(arr)) return arr.length > 0 ? arr.join(', ') : 'N/A';
        return arr;
    };

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
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); 
        }
        .header { 
            background: linear-gradient(135deg, #23471d 0%, #3d6b33 100%);
            padding: 25px 20px; 
            text-align: center; 
            color: #ffffff; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 20px; 
            font-weight: 800; 
            line-height: 1.4;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p { 
            margin: 8px 0 0; 
            font-size: 14px; 
            opacity: 0.9;
            font-weight: 500;
        }
        .status-badge {
            background-color: ${data.paymentStatus === 'Completed' ? '#dcfce7' : '#fee2e2'};
            color: ${data.paymentStatus === 'Completed' ? '#166534' : '#991b1b'};
            padding: 8px 20px;
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            border-bottom: 2px solid ${data.paymentStatus === 'Completed' ? '#bbf7d0' : '#fecaca'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .content { 
            padding: 25px 20px; 
            color: #333333; 
            line-height: 1.6; 
            font-size: 14px;
        }
        .section-title {
            color: #23471d;
            font-size: 16px;
            font-weight: 700;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .details-section { 
            background-color: #f9fafb; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb;
        }
        .details-row { 
            display: block;
            margin-bottom: 15px; 
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .details-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .details-label { 
            font-weight: 600; 
            color: #64748b; 
            font-size: 11px;
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .details-value { 
            color: #1e293b; 
            font-size: 15px;
            font-weight: 500;
            display: block;
            word-break: break-word;
        }
        .highlight {
            color: #23471d;
            font-weight: 700;
        }
        .action-section { 
            background-color: #f0fdf4; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 25px 0; 
            border-left: 4px solid #23471d; 
        }
        .action-section h3 { 
            color: #166534; 
            margin: 0 0 12px 0;
            font-size: 16px; 
            font-weight: 700;
        }
        .action-section ul { 
            margin: 0; 
            padding-left: 20px; 
        }
        .action-section li { 
            margin: 8px 0; 
            color: #14532d; 
            font-size: 14px;
        }
        .footer { 
            background-color: #111827; 
            padding: 25px; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 12px; 
            line-height: 1.6;
        }
        .footer p { margin: 5px 0; }

        @media only screen and (min-width: 600px) {
            body { padding: 20px; }
            .container { border-radius: 16px; }
            .header { padding: 35px 30px; }
            .header h1 { font-size: 24px; }
            .content { padding: 40px; }
            .details-row { 
                display: flex; 
                align-items: flex-start;
                border-bottom: none;
                margin-bottom: 12px;
                padding-bottom: 0;
            }
            .details-label { 
                min-width: 220px;
                max-width: 220px;
                font-size: 12px;
                margin-bottom: 0;
                padding-right: 20px;
            }
            .details-value { font-size: 15px; flex: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Buyer Registration Alert</h1>
            <p>ID: ${data.registrationId}</p>
        </div>
        
        <div class="status-badge">
            Payment Status: <strong>${data.paymentStatus || 'Pending'}</strong>
        </div>

        <div class="content">
            <p><strong>Dear Admin,</strong></p>
            <p>A new high-value Buyer Registration has been received for <strong>IHWE 2026</strong>. Please review the lead profile and coordinate for the Buyer-Seller Meet.</p>

            <h2 class="section-title">👤 Contact Information</h2>
            <div class="details-section">
                <div class="details-row">
                    <span class="details-label">Full Name</span>
                    <span class="details-value highlight">${data.companyName}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Designation</span>
                    <span class="details-value">${data.designation}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Company Name</span>
                    <span class="details-value">${data.companyName}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Email ID</span>
                    <span class="details-value">${data.emailAddress}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Mobile Number</span>
                    <span class="details-value">${data.mobileNumber}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Location</span>
                    <span class="details-value">${data.city}, ${data.stateProvince}, ${data.country || 'India'}</span>
                </div>
            </div>

            <h2 class="section-title">💼 Business Profile</h2>
            <div class="details-section">
                <div class="details-row">
                    <span class="details-label">Business Type</span>
                    <span class="details-value">${data.businessType}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Years in Operation</span>
                    <span class="details-value">${data.yearsInOperation}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Annual Turnover</span>
                    <span class="details-value">${data.annualTurnover}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Key Products/Services</span>
                    <span class="details-value">${data.keyProductsServices}</span>
                </div>
            </div>

            <h2 class="section-title">🎯 Sourcing & Buying Interests</h2>
            <div class="details-section">
                <div class="details-row">
                    <span class="details-label">Primary Product Interest</span>
                    <span class="details-value highlight">${data.primaryProductInterest}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Secondary Categories</span>
                    <span class="details-value">${formatArray(data.secondaryProductCategories)}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Budget Range</span>
                    <span class="details-value">${data.budgetRange || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Buying Frequency</span>
                    <span class="details-value">${data.buyingFrequency}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Purchase Timeline</span>
                    <span class="details-value">${data.purchaseTimeline}</span>
                </div>
            </div>

            <h2 class="section-title">📅 B2B & Registration</h2>
            <div class="details-section">
                <div class="details-row">
                    <span class="details-label">Category</span>
                    <span class="details-value">${data.registrationCategory}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Fee Amount</span>
                    <span class="details-value">${data.registrationFee || 'N/A'}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Preferred Meeting Date</span>
                    <span class="details-value">${data.preferredMeetingDate}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Priority Level</span>
                    <span class="details-value">${data.meetingPriorityLevel}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Transaction ID</span>
                    <span class="details-value">${data.transactionId || 'N/A'}</span>
                </div>
            </div>

            <div class="action-section">
                <h3>📌 Next Steps</h3>
                <ul>
                    <li>Verify payment completeness in Razorpay Dashboard.</li>
                    <li>Review Buyer's products & matchmaking score.</li>
                    <li>Update CRM status for B2B matchmaking.</li>
                    <li>Initiate introduction with relevant exhibitors.</li>
                </ul>
            </div>

            <p style="text-align: center; color: #64748b; font-size: 13px;">
                Lead generated on ${registrationDate} at ${registrationTime}
            </p>
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

module.exports = { getBuyerRegistrationAlertTemplate };
