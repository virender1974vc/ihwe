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
    } else if (context === 'SPONSOR') {
        msg = `${greeting}IHWE Sponsorship Verification Code:\n\n*${otp}*\n\nThis code is required to verify your interest in Sponsorship for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    } else if (context === 'EXPO_SUPPORT') {
        msg = `${greeting}IHWE Expo Support Verification Code:\n\n*${otp}*\n\nThis code is required to verify your request for Expo Support Services for the International Health & Wellness Expo (IHWE).\n\nValid for 10 minutes only.\n\nFor your security, do not share this code with anyone.\n\n– Team IHWE\n\nNamo Gange Wellness Pvt. Ltd.`;
    }

    try {
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

const sendWhatsAppMessage = async (mobile, msg, name = null, options = {}) => {
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
        WhatsAppLog.create({
            recipient: mobile,
            message: msg,
            name: name || 'System Notification',
            status,
            error: errorMsg,
            senderId: options.senderId || null,
            senderName: options.senderName || null,
            companyId: options.companyId || null,
            companyName: options.companyName || null
        }).catch(err => console.error('Error saving WhatsApp log:', err));
    }
};

const sendWhatsAppRichMessage = async (mobile, msg, files = [], name = null, options = {}) => {
    let status = 'failed';
    let errorMsg = null;

    try {
        let formattedMobile = mobile.replace(/\D/g, '');
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const apiKey = (process.env.OPUS_API_KEY || '').trim();
        let url = `https://api.opustechnology.in/wapp/v2/api/send?apikey=${apiKey}&mobile=${formattedMobile}&msg=${encodeURIComponent(msg)}`;

        let imgCount = 1;
        let pdfCount = 1;
        let videoCount = 1;
        let docCount = 1;

        if (files && files.length > 0) {
            files.forEach(f => {
                let type = f.fileType || f.type;
                let fileUrl = f.fileUrl || f.url;

                if (!fileUrl) return;

                // Opus API is a cloud service and cannot download files from localhost
                if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) {
                    console.warn(`[WhatsApp] Skipping local file attachment for Opus API: ${fileUrl}`);
                    return;
                }

                if (type === "Image") {
                    url += `&img${imgCount}=${encodeURIComponent(fileUrl)}`;
                    imgCount++;
                } else if (type === "PDF") {
                    url += `&${pdfCount === 1 ? 'pdf' : `pdf${pdfCount}`}=${encodeURIComponent(fileUrl)}`;
                    pdfCount++;
                } else if (type === "Video") {
                    url += `&${videoCount === 1 ? 'video' : `video${videoCount}`}=${encodeURIComponent(fileUrl)}`;
                    videoCount++;
                } else if (type === "Word" || type === "PPT") {
                    url += `&${docCount === 1 ? 'document' : `document${docCount}`}=${encodeURIComponent(fileUrl)}`;
                    docCount++;
                }
            });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`API returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 100)}`);
        }

        console.log(`WhatsApp Rich Message sent to ${mobile}:`, data);
        status = 'success';
        return { success: true, data };
    } catch (error) {
        console.error(`Error sending Rich WhatsApp to ${mobile}:`, error);
        errorMsg = error.message || 'Failed to connect to WhatsApp API';
        return { success: false, error: errorMsg };
    } finally {
        WhatsAppLog.create({
            recipient: mobile,
            message: msg + " [RICH MEDIA]",
            name: name || 'System Notification',
            status,
            error: errorMsg,
            senderId: options.senderId || null,
            senderName: options.senderName || null,
            companyId: options.companyId || null,
            companyName: options.companyName || null
        }).catch(err => console.error('Error saving WhatsApp log:', err));
    }
};

module.exports = {
    sendWhatsAppOTP,
    sendWhatsAppMessage,
    sendWhatsAppRichMessage
};
