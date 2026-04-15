// Simple text-based email template for admin visitor alerts

const getSimpleVisitorAlertTemplate = (data) => {
    const registrationDate = new Date().toLocaleDateString('en-GB');
    const registrationTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const interestedSegments = data.areaOfInterest?.join(', ') || 'N/A';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif;
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 20px;
            line-height: 1.6;
        }
        .container { 
            max-width: 650px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            padding: 30px;
            border-radius: 5px;
        }
        h3 {
            color: #333;
            font-size: 18px;
            margin: 20px 0 10px 0;
        }
        p {
            color: #555;
            margin: 8px 0;
            font-size: 14px;
        }
        .detail-row {
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #333;
            display: inline-block;
            min-width: 180px;
        }
        .value {
            color: #555;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #777;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <p><strong>Dear Team,</strong></p>
        
        <p>This is to inform you that a new Visitor Registration has been successfully received for the <strong>9th International Health & Wellness Expo 2026 (IHWE – Global Edition)</strong>.</p>
        
        <p>Please find the registration details below for your reference and necessary follow-up:</p>
        
        <h3>🔹 Visitor Details</h3>
        
        <div class="detail-row">
            <span class="label">Registration ID:</span>
            <span class="value">${data.registrationId}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Registration Date:</span>
            <span class="value">${registrationDate}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Registration Time:</span>
            <span class="value">${registrationTime}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">${data.firstName} ${data.lastName}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Category:</span>
            <span class="value">${data.visitorType}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Company Name:</span>
            <span class="value">${data.companyName}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Designation:</span>
            <span class="value">${data.designation}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Email ID:</span>
            <span class="value">${data.email}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Mobile Number:</span>
            <span class="value">${data.mobile}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">City:</span>
            <span class="value">${data.city}</span>
        </div>
        
        <div class="detail-row">
            <span class="label">Interested Segments:</span>
            <span class="value">${interestedSegments}</span>
        </div>
        
        <h3>📌 Action Required</h3>
        <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>Verify the registration details</li>
            <li>Ensure confirmation email & QR code has been sent</li>
            <li>Update the central registration database</li>
            <li>Assign follow-up (if Corporate Visitor / Buyer)</li>
        </ul>
        
        <div class="footer">
            <p>Please ensure timely action and coordination to maintain seamless visitor management.</p>
            
            <p><strong>Best Regards,</strong><br>
            Team IHWE 2026<br>
            Namo Gange Wellness Pvt. Ltd.</p>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = { getSimpleVisitorAlertTemplate };
