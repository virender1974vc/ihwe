const axios = require('axios');

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

const formatDestination = (phone) => {
    if (!phone) return null;
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    if (cleaned.startsWith('910') && cleaned.length === 13) cleaned = '91' + cleaned.substring(3);
    return '+' + cleaned;
};
const sendTemplate = async ({ campaignEnvKey, phone, userName, templateParams = [], media = null, buttonValue = null }) => {
    const apiKey = (process.env.AISENSY_API_KEY || '').trim();
    const campaignName = (process.env[campaignEnvKey] || '').trim();

    if (!apiKey || !campaignName) {
        return { success: false, skipped: true, reason: `AiSensy not configured yet for ${campaignEnvKey}` };
    }

    const destination = formatDestination(phone);
    if (!destination) {
        return { success: false, skipped: false, reason: 'Invalid phone number' };
    }

    const payload = {
        apiKey,
        campaignName,
        destination,
        userName: userName || 'Customer',
        templateParams: templateParams.map((p) => String(p ?? ''))
    };
    if (media && media.url) {
        payload.media = { url: media.url, filename: media.filename || 'file' };
    }
    if (buttonValue !== null) {
        payload.buttons = [{
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: String(buttonValue) }]
        }];
    }

    try {
        const response = await axios.post(AISENSY_API_URL, payload, { timeout: 15000 });
        return { success: response.status === 200, skipped: false, provider: 'aisensy', response: response.data };
    } catch (error) {
        console.error(`[AiSensy] Send failed for ${campaignEnvKey}:`, error.response?.data || error.message);
        return { success: false, skipped: false, provider: 'aisensy', error: error.response?.data?.message || error.message };
    }
};

module.exports = { sendTemplate, formatDestination };
