const axios = require('axios');
const Settings = require('../models/Settings');
const { decrypt } = require('../utils/cryptoHelper');

class AiDocumentVerificationService {
    async getSettingsDoc() {
        let settings = await Settings.findOne();
        if (!settings) settings = await new Settings({}).save();
        return settings;
    }

    async getAiSettings() {
        const settings = await this.getSettingsDoc();
        return settings.aiVerification;
    }
    getDecryptedKey(ai, provider) {
        return decrypt(provider === 'openai' ? ai.openaiApiKey : ai.geminiApiKey);
    }
    resolveFetchableUrl(fileUrl) {
        if (!fileUrl || !fileUrl.includes('cloudinary.com')) return fileUrl;

        try {
            const cloudinary = require('cloudinary').v2;
            const urlParts = fileUrl.split('/upload/');
            if (urlParts.length <= 1) return fileUrl;

            let publicIdWithExt = urlParts[1];
            if (publicIdWithExt.match(/^v\d+\//)) {
                publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
            }
            const isRaw = fileUrl.includes('/raw/upload/');
            const format = (!isRaw && publicIdWithExt.includes('.')) ? publicIdWithExt.split('.').pop() : '';
            const publicId = (!isRaw && publicIdWithExt.includes('.')) ? publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) : publicIdWithExt;

            return cloudinary.utils.private_download_url(publicId, format, {
                resource_type: isRaw ? 'raw' : 'image',
                type: 'upload'
            });
        } catch (e) {
            return fileUrl;
        }
    }

    isQuotaError(err) {
        const status = err?.response?.status || err?.status;
        const msg = (err?.message || JSON.stringify(err?.response?.data || '') || '').toLowerCase();
        return status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted');
    }

    buildPrompt(documentName, expectedGender) {
        const genderCheck = expectedGender
            ? `\n2. IDENTITY FRAUD CHECK: This is a registration-fraud check, not a statement about anyone's identity in general - the registrant self-declared their gender as "${expectedGender}" on their registration form, and you are verifying whether the photo they uploaded is consistent with that declaration, the same way a visa or KYC officer would. If the person visually presented in the photo (hairstyle, facial structure, body shape, clothing, etc.) is clearly and obviously presented as the opposite gender to "${expectedGender}", this is a mismatch and you must report it - this is a required compliance check, answering "unable to determine" is not acceptable unless the photo is genuinely ambiguous (e.g. face not visible, photo of a document instead of a person).`
            : '';
        const genderRule = expectedGender
            ? `\n- Photo's apparent gender presentation clearly conflicts with the declared "${expectedGender}" -> {"valid": false, "issue": "gender_mismatch", "reason": "..."}`
            : '';

        return `You are an automated content-moderation and document-verification system for an exhibition registration portal. Your job is to protect the platform from abuse, so you MUST flag problems even when the content is sensitive - do not refuse or stay silent.

The uploaded file is supposed to be: "${documentName}".

Check the image for these things, in this priority order:
1. NUDITY/EXPLICIT OR MINOR: Does the image contain nudity, sexual content, or sexually suggestive imagery of any kind (partial or full)? Also check separately: does the image appear to show a child or minor (anyone who looks under 18) in any photo, regardless of nudity? Both of these come first and override everything else - you MUST report them regardless of what the image otherwise looks like.${genderCheck}
${expectedGender ? '3' : '2'}. MISMATCH: If none of the above, does the image clearly fail to match the expected document type "${documentName}" (e.g. a random photo, selfie, screenshot, or unrelated picture instead of the actual document)?
${expectedGender ? '4' : '3'}. UNREADABLE: If none of the above, is the image too blurry, blank, cropped, or low-quality to verify at all?

Respond ONLY with a JSON object (no markdown fences, no extra text) in exactly this format:
{"valid": true, "issue": null, "reason": "short reason"}

- Nudity/explicit found -> {"valid": false, "issue": "nudity", "reason": "..."}
- Image shows a child/minor -> {"valid": false, "issue": "minor", "reason": "..."}${genderRule}
- Wrong document type -> {"valid": false, "issue": "mismatch", "reason": "..."}
- Unreadable -> {"valid": false, "issue": "unreadable", "reason": "..."}
- None of the above -> {"valid": true, "issue": null, "reason": "Looks valid"}

Be lenient about minor image quality issues, but be strict and decisive about nudity and minors - these are safety-critical checks.`;
    }

    parseAiResponse(text) {
        try {
            const cleaned = String(text).replace(/```json|```/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
            return {
                skipped: false,
                valid: parsed.valid !== false,
                issue: parsed.issue || null,
                reason: parsed.reason || ''
            };
        } catch (e) {
            // Could not parse AI response - fail open rather than blocking the upload
            return { skipped: true, reason: 'parse_error' };
        }
    }
    async verifyDocument({ fileUrl, documentName, fileType, expectedGender }) {
        const ai = await this.getAiSettings();

        if (!ai.isEnabled) return { skipped: true, reason: 'disabled' };

        const type = (fileType || '').toUpperCase();
        const supportedImageTypes = ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'];
        const isImage = supportedImageTypes.includes(type);
        const isPdf = type === 'PDF';

        if (!isImage && !isPdf) {
            return { skipped: true, reason: 'unsupported_type' };
        }
        if (isPdf && ai.provider === 'openai') {
            return { skipped: true, reason: 'unsupported_type' };
        }

        const apiKey = this.getDecryptedKey(ai, ai.provider);
        if (!apiKey) return { skipped: true, reason: 'no_key' };

        try {
            const fetchUrl = this.resolveFetchableUrl(fileUrl);
            const fileResp = await axios.get(fetchUrl, { responseType: 'arraybuffer', timeout: 20000 });
            const base64 = Buffer.from(fileResp.data).toString('base64');
            const mimeType = fileResp.headers['content-type'] || (isPdf ? 'application/pdf' : 'image/jpeg');

            if (ai.provider === 'gemini') {
                return await this.verifyWithGemini(base64, mimeType, documentName, apiKey, ai.geminiModel, expectedGender);
            }
            return await this.verifyWithOpenAI(base64, mimeType, documentName, apiKey, ai.openaiModel, expectedGender);
        } catch (err) {
            if (this.isQuotaError(err)) {
                console.error('AI document verification quota error:', err.message);
                return { skipped: true, reason: 'quota_exceeded', error: err.message };
            }
            console.error('AI document verification error:', err.message);
            return { skipped: true, reason: 'error' };
        }
    }

    async verifyWithGemini(base64, mimeType, documentName, apiKey, model, expectedGender) {
        const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({
            model: model || 'gemini-2.5-flash',
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });

        const result = await genModel.generateContent([
            { inlineData: { data: base64, mimeType } },
            { text: this.buildPrompt(documentName, expectedGender) }
        ]);

        const response = result.response;
        const blockReason = response.promptFeedback?.blockReason;
        const finishReason = response.candidates?.[0]?.finishReason;
        if (blockReason || finishReason === 'SAFETY') {
            return { skipped: false, valid: false, issue: 'nudity', reason: 'Flagged as inappropriate content by the AI provider\'s safety system.' };
        }

        return this.parseAiResponse(response.text());
    }

    async verifyWithOpenAI(base64, mimeType, documentName, apiKey, model, expectedGender) {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey });

        const response = await client.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: this.buildPrompt(documentName, expectedGender) },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
            }],
            max_tokens: 300
        });

        return this.parseAiResponse(response.choices[0].message.content);
    }
    async testImageVerification({ buffer, mimeType, documentName, provider, apiKey, model, expectedGender }) {
        const ai = await this.getAiSettings();
        const useProvider = provider || ai.provider;
        const useApiKey = apiKey || this.getDecryptedKey(ai, useProvider);
        const useModel = model || (useProvider === 'openai' ? ai.openaiModel : ai.geminiModel);

        if (!useApiKey) {
            return { skipped: true, reason: 'no_key', error: `No ${useProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key saved yet. Save one above first.` };
        }

        const base64 = buffer.toString('base64');
        try {
            if (useProvider === 'gemini') {
                return await this.verifyWithGemini(base64, mimeType, documentName || 'Test Document', useApiKey, useModel, expectedGender);
            }
            return await this.verifyWithOpenAI(base64, mimeType, documentName || 'Test Document', useApiKey, useModel, expectedGender);
        } catch (err) {
            console.error('AI test image verification error:', err?.response?.data || err?.message || err);
            if (this.isQuotaError(err)) {
                return { skipped: true, reason: 'quota_exceeded', error: err.message };
            }
            return { skipped: true, reason: 'error', error: err.message };
        }
    }

    /**
     * Quick connectivity test used by the admin settings page before saving a key.
     */
    async testConnection({ provider, apiKey, model }) {
        if (!apiKey) return { success: false, message: 'API key is required' };

        try {
            if (provider === 'gemini') {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const genModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' });
                await genModel.generateContent('Reply with exactly: OK');
            } else {
                const OpenAI = require('openai');
                const client = new OpenAI({ apiKey });
                await client.chat.completions.create({
                    model: model || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
                    max_tokens: 5
                });
            }
            return { success: true, message: 'Connection successful' };
        } catch (err) {
            console.error('AI test connection raw error:', err?.response?.data || err?.message || err);
            if (this.isQuotaError(err)) {
                return { success: false, message: `Key is valid but the quota/rate limit has already been reached. (${err.message})` };
            }
            return { success: false, message: err.message || 'Connection failed' };
        }
    }
}

module.exports = new AiDocumentVerificationService();
