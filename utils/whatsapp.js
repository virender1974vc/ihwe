const WhatsAppLog = require('../models/WhatsAppLog');
const aisensy = require('./aisensyService');

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
        // Try AiSensy first (Authentication template). Falls through to legacy Opus
        // below if AiSensy isn't configured yet OR if the AiSensy attempt itself fails
        // (e.g. template rejected/pending) - Opus is a permanent safety net, not just a
        // during-migration fallback.
        const aisensyResult = await aisensy.sendTemplate({
            campaignEnvKey: 'AISENSY_CAMPAIGN_OTP',
            phone: mobile,
            userName: name || 'Customer',
            templateParams: [otp],
            buttonValue: otp
        });
        if (aisensyResult.success) {
            status = 'success';
            return { success: true, data: aisensyResult.response, provider: 'aisensy' };
        }
        if (!aisensyResult.skipped) {
            console.warn(`[WhatsApp] AiSensy OTP attempt failed, falling back to Opus: ${aisensyResult.error || aisensyResult.reason}`);
        }

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
        // Try AiSensy first, using the generic "freeform wrapper" template — this one
        // function is shared by referral/advisory/partner/seller confirmations, admin
        // broadcast, AND every visitor/buyer/exhibitor dynamic confirmation, so it
        // carries whatever final message text the caller already built.
        const aisensyResult = await aisensy.sendTemplate({
            campaignEnvKey: 'AISENSY_CAMPAIGN_ADMIN_FREEFORM',
            phone: mobile,
            userName: options.companyName || 'Customer',
            templateParams: [msg]
        });
        if (aisensyResult.success) {
            status = 'success';
            return { success: true, data: aisensyResult.response, provider: 'aisensy' };
        }
        if (!aisensyResult.skipped) {
            console.warn(`[WhatsApp] AiSensy send failed, falling back to Opus: ${aisensyResult.error || aisensyResult.reason}`);
        }

        // Normalize mobile number (Ensure 91 prefix for 10-digit Indian numbers)
        let formattedMobile = mobile.replace(/\D/g, ''); // Remove non-digits
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const apiKey = (process.env.OPUS_API_KEY || '').trim();
        if (!apiKey) {
            throw new Error('OPUS_API_KEY is not configured');
        }
        const url = `https://api.opustechnology.in/wapp/v2/api/send?apikey=${apiKey}&mobile=${formattedMobile}&msg=${encodeURIComponent(msg)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`WhatsApp API returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 120)}`);
        }
        if (!response.ok) {
            throw new Error(`WhatsApp API responded with ${response.status}: ${responseText.substring(0, 120)}`);
        }
        const apiStatus = String(data.status || data.Status || data.success || '').toLowerCase();
        const apiMessage = data.message || data.Message || data.error || data.Error || '';
        if (apiStatus && ['false', 'failed', 'fail', 'error', '0'].includes(apiStatus)) {
            throw new Error(`WhatsApp API failed: ${apiMessage || responseText.substring(0, 120)}`);
        }
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

const sendOpusWhatsAppMessage = async (mobile, msg, name = null, options = {}) => {
    let status = 'failed';
    let errorMsg = null;

    try {
        let formattedMobile = mobile.replace(/\D/g, ''); 
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        }

        const apiKey = (process.env.OPUS_API_KEY || '').trim();
        if (!apiKey) {
            throw new Error('OPUS_API_KEY is not configured');
        }
        const url = `https://api.opustechnology.in/wapp/v2/api/send?apikey=${apiKey}&mobile=${formattedMobile}&msg=${encodeURIComponent(msg)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`WhatsApp API returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 120)}`);
        }
        if (!response.ok) {
            throw new Error(`WhatsApp API responded with ${response.status}: ${responseText.substring(0, 120)}`);
        }
        const apiStatus = String(data.status || data.Status || data.success || '').toLowerCase();
        const apiMessage = data.message || data.Message || data.error || data.Error || '';
        if (apiStatus && ['false', 'failed', 'fail', 'error', '0'].includes(apiStatus)) {
            throw new Error(`WhatsApp API failed: ${apiMessage || responseText.substring(0, 120)}`);
        }
        console.log(`Opus WhatsApp Message sent to ${mobile}:`, data);
        status = 'success';
        return { success: true, data };
    } catch (error) {
        console.error(`Error sending Opus WhatsApp to ${mobile}:`, error);
        errorMsg = error.message || 'Failed to connect to WhatsApp API';
        return { success: false, error: errorMsg };
    } finally {
        WhatsAppLog.create({
            recipient: mobile,
            message: msg,
            name: name || 'System Notification (Opus)',
            status,
            error: errorMsg,
            senderId: options.senderId || null,
            senderName: options.senderName || null,
            companyId: options.companyId || null,
            companyName: options.companyName || null
        }).catch(err => console.error('Error saving WhatsApp log:', err));
    }
};

const sendPassApprovalWhatsApp = async (mobile, quantity, type, email, name = null) => {
    let status = 'failed';
    try {
        const aisensyResult = await aisensy.sendTemplate({
            campaignEnvKey: 'AISENSY_CAMPAIGN_PASS_APPROVAL',
            phone: mobile,
            userName: name || 'Customer',
            templateParams: [String(quantity), type, email]
        });
        
        if (aisensyResult.success) {
            status = 'success';
            return { success: true, data: aisensyResult.response, provider: 'aisensy' };
        }
        
        if (!aisensyResult.skipped) {
            console.warn(`[WhatsApp] AiSensy pass approval send failed, falling back to Opus: ${aisensyResult.error || aisensyResult.reason}`);
        }

        const waMsg = `Dear Exhibitor,\n\nYour request for ${quantity} ${type} pass(es) has been APPROVED.\n\nWe have sent the entry QR codes to your registered email address (${email}). Please check your inbox (and spam folder) and present the QR codes at the entry gates.\n\nRegards,\nTeam IHWE`;
        
        return await sendOpusWhatsAppMessage(mobile, waMsg, 'Pass Approval Notification');
    } catch (error) {
        console.error(`Error sending Pass Approval WhatsApp to ${mobile}:`, error);
        return { success: false, error: error.message };
    }
};

const sendWhatsAppRichMessage = async (mobile, msg, files = [], name = null, options = {}) => {
    let status = 'failed';
    let errorMsg = null;

    try {
        // Try AiSensy first, one call per file (each WhatsApp template header can only
        // carry ONE media type). Any file whose matching campaign isn't configured yet
        // gets skipped here and falls through to the legacy Opus path below instead —
        // unless NO files matched AiSensy at all, in which case we use the original
        // single-call Opus rich message (all attachments combined) as before.
        const AISENSY_CAMPAIGN_BY_TYPE = {
            Image: 'AISENSY_CAMPAIGN_MATERIAL_IMAGE',
            Video: 'AISENSY_CAMPAIGN_MATERIAL_VIDEO',
            PDF: 'AISENSY_CAMPAIGN_MATERIAL_DOC',
            Word: 'AISENSY_CAMPAIGN_MATERIAL_DOC',
            PPT: 'AISENSY_CAMPAIGN_MATERIAL_DOC'
        };

        if (files && files.length > 0 && (process.env.AISENSY_API_KEY || '').trim()) {
            const aisensyAttempts = [];
            for (const f of files) {
                const type = f.fileType || f.type;
                const fileUrl = f.fileUrl || f.url;
                const campaignEnvKey = AISENSY_CAMPAIGN_BY_TYPE[type];
                if (!fileUrl || !campaignEnvKey) continue;

                const result = await aisensy.sendTemplate({
                    campaignEnvKey,
                    phone: mobile,
                    userName: options.companyName || 'Customer',
                    templateParams: [name || 'Customer', msg],
                    media: { url: fileUrl, filename: fileUrl.split('/').pop() }
                });
                if (!result.skipped) aisensyAttempts.push(result);
            }

            if (aisensyAttempts.length > 0 && aisensyAttempts.every(r => r.success)) {
                status = 'success';
                return { success: true, data: aisensyAttempts, provider: 'aisensy' };
            }
            if (aisensyAttempts.some(r => !r.success)) {
                console.warn('[WhatsApp] One or more AiSensy material sends failed, falling back to Opus for all files.');
            }
        }

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
    sendOpusWhatsAppMessage,
    sendPassApprovalWhatsApp,
    sendWhatsAppRichMessage
};
