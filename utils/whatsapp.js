const WhatsAppLog = require('../models/WhatsAppLog');

const sendWhatsAppOTP = async (mobile, otp, context = 'CONTACT', name = null) => {
    let status = 'failed';
    let errorMsg = null;
    
    let greeting = name ? `Namo Gange Namaskar!\n\nDear ${name},\n\n` : `Namo Gange Namaskar!\n\n`;
    
    let msg = `${greeting}IHWE Secure Verification Code:\n\n*${otp}*\n\nThis code is required to complete your mobile verification for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    
    if (context === 'VISITOR') {
        msg = `${greeting}IHWE Visitor Verification Code:\n\n*${otp}*\n\nThis code is required to complete your visitor registration for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    } else if (context === 'EXHIBITOR') {
        msg = `${greeting}IHWE Exhibitor Verification Code:\n\n*${otp}*\n\nThis code is required to complete your exhibitor verification for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    } else if (context === 'BUYER') {
        msg = `${greeting}IHWE Buyer Verification Code:\n\n*${otp}*\n\nThis code is required to complete your buyer registration for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    } else if (context === 'DELEGATE') {
        msg = `${greeting}IHWE Delegate Verification Code:\n\n*${otp}*\n\nThis code is required to complete your delegate registration for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    } else if (context === 'SELLER') {
        msg = `${greeting}IHWE Seller Verification Code:\n\n*${otp}*\n\nThis code is required to complete your seller registration for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    }
    
    try {
        // Normalize mobile number (Ensure 91 prefix for 10-digit Indian numbers)
        let formattedMobile = mobile.replace(/\D/g, ''); // Remove non-digits
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const apiKey = (process.env.OPUS_API_KEY || '').trim();
        const url = `https://api.opustechnology.in/wapp/v2/api/send?apikey=${apiKey}&mobile=${formattedMobile}&msg=${encodeURIComponent(msg)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        console.log(`[WhatsApp] Dispatching OTP to ${formattedMobile}...`);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WhatsApp] API Error Status: ${response.status}`, errorText);
            throw new Error(`WhatsApp API responded with ${response.status}`);
        }

        const data = await response.json();
        console.log('[WhatsApp] OTP API success:', data);
        status = 'success';
        return { success: true, data };
    } catch (error) {
        console.error('[WhatsApp] Critical Error sending OTP:', error.message);
        errorMsg = error.message || 'Failed to connect to WhatsApp API';
        return { success: false, error: errorMsg };
    } finally {
        // Log the OTP attempt
        WhatsAppLog.create({
            recipient: mobile,
            message: msg,
            name: 'OTP Verification',
            status,
            error: errorMsg
        }).catch(err => console.error('Error saving WhatsApp OTP log:', err));
    }
};

const sendWhatsAppMessage = async (mobile, msg, name = null) => {
    let status = 'failed';
    let errorMsg = null;
    
    try {
        // Normalize mobile number (Ensure 91 prefix for 10-digit Indian numbers)
        let formattedMobile = mobile.replace(/\D/g, ''); // Remove non-digits
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const apiKey = (process.env.OPUS_API_KEY || '').trim();
        const url = `https://api.opustechnology.in/wapp/v2/api/send?apikey=${apiKey}&mobile=${formattedMobile}&msg=${encodeURIComponent(msg)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log(`WhatsApp Message sent to ${mobile}:`, data);
        status = 'success';
        return { success: true, data };
    } catch (error) {
        console.error(`Error sending WhatsApp to ${mobile}:`, error);
        errorMsg = error.message || 'Failed to connect to WhatsApp API';
        return { success: false, error: errorMsg };
    } finally {
        // Log the message attempt
        WhatsAppLog.create({
            recipient: mobile,
            message: msg,
            name: name || 'System Notification',
            status,
            error: errorMsg
        }).catch(err => console.error('Error saving WhatsApp log:', err));
    }
};

module.exports = { 
    sendWhatsAppOTP,
    sendWhatsAppMessage
};
