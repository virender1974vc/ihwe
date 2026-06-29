const QRCode = require('qrcode');
const emailServiceInstance = require('./emailService');
const whatsapp = require('./whatsapp');

// HTML templates for different pass types
const generatePassHTML = (passRequest, qrCodesHtml) => {
    const type = passRequest.passType;
    let title = 'IHWE Pass';
    let themeColor = '#23471d'; // Default IHWE green

    switch (type) {
        case 'exhibitor':
            title = 'Exhibitor Pass';
            themeColor = '#f59e0b'; // Amber/Orange
            break;
        case 'vehicle':
            title = 'Vehicle Pass';
            themeColor = '#10b981'; // Green
            break;
        case 'service':
            title = 'Service Pass';
            themeColor = '#8b5cf6'; // Purple
            break;
        case 'visitor':
            title = 'Visitor Pass';
            themeColor = '#3b82f6'; // Blue
            break;
    }

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${themeColor}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Your ${title} is Ready!</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; line-height: 1.5;">Dear Exhibitor,</p>
            <p style="font-size: 16px; line-height: 1.5;">Your request for <strong>${passRequest.quantity} ${title}(s)</strong> has been successfully approved.</p>
            <p style="font-size: 16px; line-height: 1.5;">Please find the entry QR codes for your passes below. You can show these QR codes at the respective entry gates for quick access.</p>
            
            <div style="margin-top: 30px;">
                ${qrCodesHtml}
            </div>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0;">If you have any questions, please contact the IHWE Support Team.</p>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 5px;">&copy; 2026 IHWE. All Rights Reserved.</p>
        </div>
    </div>
    `;
};

const sendPassNotifications = async (passRequest, exhibitorData) => {
    try {
        const type = passRequest.passType;

        const exhibitorEmail = exhibitorData.companyEmail || exhibitorData.contact1?.email;
        const exhibitorPhone = exhibitorData.contact1?.mobile || exhibitorData.contact1?.whatsapp;
        const exhibitorName = exhibitorData.exhibitorName || 'Exhibitor';

        const items = type === 'vehicle' ? passRequest.vehicles : passRequest.personnel;
        
        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                const qrData = JSON.stringify({ reqId: passRequest._id.toString(), type: type, index: i });
                const qrBuffer = await QRCode.toBuffer(qrData, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                const cid = `qrcode_${type}_${i}@ihwe.in`;

                const attachments = [{ filename: `${type}-pass.png`, content: qrBuffer, cid: cid }];
                
                let itemDetails = '';
                if (type === 'vehicle') {
                    itemDetails = `<strong>Vehicle No:</strong> ${item.vehicleNumber || 'N/A'} <br/> <strong>Type:</strong> ${item.vehicleType || 'N/A'}`;
                    if (item.name) itemDetails += `<br/> <strong>Driver/Contact:</strong> ${item.name}`;
                } else {
                    itemDetails = `<strong>Name:</strong> ${item.name || 'N/A'} <br/> <strong>Designation:</strong> ${item.designation || 'N/A'}`;
                }

                const qrCodesHtmlArray = [`
                    <div style="background-color: white; border: 1px dashed #d1d5db; padding: 15px; margin-bottom: 20px; text-align: center; border-radius: 6px;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;">${itemDetails}</p>
                        <img src="cid:${cid}" alt="QR Code" style="max-width: 150px; height: auto;" />
                    </div>
                `];

                const emailHtml = generatePassHTML({ quantity: 1, passType: type }, qrCodesHtmlArray.join(''));
                const subject = `Your IHWE ${type.charAt(0).toUpperCase() + type.slice(1)} Pass is Approved`;

                const targetEmail = item.email || exhibitorEmail;
                if (targetEmail) {
                    await emailServiceInstance.sendEmail({
                        to: targetEmail, subject: subject, html: emailHtml, attachments: attachments, profile: 'EXHIBITOR',
                        logData: { name: item.name || exhibitorName, phone: item.phone, message: `Sent ${type} pass QR code` }
                    });
                }
                
                const targetPhone = item.phone || exhibitorPhone;
                if (targetPhone) {
                    await whatsapp.sendPassApprovalWhatsApp(targetPhone, 1, type, targetEmail || 'N/A', item.name || exhibitorName);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('[PassEmailService] Error sending pass notifications:', error);
        return false;
    }
};

module.exports = {
    sendPassNotifications
};
