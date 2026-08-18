const axios = require('axios');
const Settings = require('../models/Settings');
const { decrypt } = require('../utils/cryptoHelper');

class AiDocumentVerificationService {
    async getSettingsDoc() {
        // Sorted so behavior stays deterministic even if a stray duplicate Settings doc
        // exists (the oldest doc is always the canonical one in this codebase).
        let settings = await Settings.findOne().sort({ createdAt: 1 });
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
        if (String(documentName).trim().toLowerCase() === 'company logo') {
            return `You are a content-moderation system for company logo uploads on an exhibition portal.

The uploaded image is supposed to be a company logo or brand image. Accept normal brand logos, text marks, symbols, product packaging with clear branding, storefront/signboard images, or clean brand creatives.

Reject when the image clearly contains:
- nudity, explicit sexual content, or strongly sexually suggestive content -> issue "nudity"
- bikini, lingerie, underwear, swimwear model photos, revealing glamour/model poses, or adult body-focused fashion/catalog photos -> issue "nudity"
- a child/minor in an unsafe or inappropriate context -> issue "minor"
- graphic violence, hateful imagery, or other clearly inappropriate content -> issue "inappropriate_content"
- a person/model/selfie/photo shoot/product catalog image instead of an actual logo or brand image -> issue "mismatch"

Important:
- Do not accept a human model photo as a company logo just because it may be from a fashion brand.
- If the image is mainly a person/model/body, reject it as "mismatch"; if it is revealing or sexually suggestive, reject it as "nudity".
- Be strict for the Company Logo field.

Respond ONLY with valid JSON:
{"valid": true, "issue": null, "reason": "Looks safe"}
or
{"valid": false, "issue": "nudity|minor|inappropriate_content|mismatch", "reason": "short reason"}`;
        }

        if (String(documentName).trim().toLowerCase() === 'person photo') {
            return `You are a content-moderation system for profile photos on an exhibition portal.

Review the uploaded image only for unsafe or inappropriate content. A normal portrait, selfie, headshot, candid photo, or full-body photo of an adult is allowed. Do not reject it merely because it is not an identity document or because the face is not studio-quality.

Reject only when the image contains:
- nudity, sexual or sexually suggestive content -> issue "nudity"
- a child/minor, because this portal accepts adult team members only -> issue "minor"
- graphic violence, hateful imagery, or other clearly inappropriate content -> issue "inappropriate_content"

Respond ONLY with valid JSON:
{"valid": true, "issue": null, "reason": "Looks safe"}
or
{"valid": false, "issue": "nudity|minor|inappropriate_content", "reason": "short reason"}`;
        }

        const genderCheck = expectedGender
            ? `\n2. IDENTITY FRAUD CHECK: This is a registration-fraud check, not a statement about anyone's identity in general - the registrant self-declared their gender as "${expectedGender}" on their registration form, and you are verifying whether the photo they uploaded is consistent with that declaration, the same way a visa or KYC officer would. If the person visually presented in the photo (hairstyle, facial structure, body shape, clothing, etc.) is clearly and obviously presented as the opposite gender to "${expectedGender}", this is a mismatch and you must report it - this is a required compliance check, answering "unable to determine" is not acceptable unless the photo is genuinely ambiguous (e.g. face not visible, photo of a document instead of a person).`
            : '';
        const genderRule = expectedGender
            ? `\n- Photo's apparent gender presentation clearly conflicts with the declared "${expectedGender}" -> {"valid": false, "issue": "gender_mismatch", "reason": "..."}`
            : '';

        return `You are an automated content-moderation and document-verification system for an exhibition registration portal. Your job is to protect the platform from abuse, so you MUST flag problems even when the content is sensitive - do not refuse or stay silent.

The uploaded file is supposed to be: "${documentName}".

Check the image for these things, in this priority order:
1. NUDITY/EXPLICIT OR MINOR: Does the image contain nudity, sexual content, or sexually suggestive imagery of any kind (partial or full)? Also check separately: does the image appear to show a child or minor (anyone who looks under 18)? Both of these come first and override everything else - you MUST report them regardless of what the image otherwise looks like.
   **CRITICAL EXCEPTION FOR MINORS ON ID PROOFS:** If the uploaded document is a government ID card (Aadhar, PAN, Passport, Driving License, etc.), DO NOT reject it for being a "minor" just because the photo on the ID was taken when they were a child/minor. Many adults have IDs issued when they were minors. ONLY reject an ID card for being a minor if the Date of Birth on the ID explicitly proves they are CURRENTLY under 18 years of age (today's year is 2026, so born after 2008).${genderCheck}
${expectedGender ? '3' : '2'}. MISMATCH: If none of the above, does the image clearly fail to match the expected document type "${documentName}" (e.g. a random photo, selfie, screenshot, or unrelated picture instead of the actual document)?
${expectedGender ? '4' : '3'}. UNREADABLE: If none of the above, is the image too blurry, blank, cropped, or low-quality to verify at all?

Respond ONLY with a JSON object (no markdown fences, no extra text) in exactly this format:
{"valid": true, "issue": null, "reason": "short reason"}

- Nudity/explicit found -> {"valid": false, "issue": "nudity", "reason": "..."}
- Image shows a child/minor (unless it is a valid ID card of a current adult) -> {"valid": false, "issue": "minor", "reason": "..."}${genderRule}
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
            const isInvalid = parsed.valid === false
                || String(parsed.valid).trim().toLowerCase() === 'false';
            return {
                skipped: false,
                valid: !isInvalid,
                issue: parsed.issue ? String(parsed.issue).trim().toLowerCase() : null,
                reason: parsed.reason || '',
                // Only populated when the caller asked for field extraction
                // (see buildMsmeExtractionPrompt) — other callers (logo/photo
                // moderation, general document mismatch checks) just won't
                // have this key in their prompt's JSON, so it stays undefined.
                extractedDetails: (parsed.extractedDetails && typeof parsed.extractedDetails === 'object') ? parsed.extractedDetails : null,
                // Only populated when the caller asked for an eligibility
                // screening assessment (see buildMsmeEligibilityScreeningPrompt).
                screening: (parsed.screening && typeof parsed.screening === 'object') ? parsed.screening : null,
            };
        } catch (e) {
            // Could not parse AI response - fail open rather than blocking the upload
            return { skipped: true, reason: 'parse_error' };
        }
    }

    // Per-document-type field list for MSME PMS claim documents — asked for
    // literally (not inferred) so the AI doesn't invent fields that don't
    // apply to a given document type.
    static MSME_EXTRACT_FIELDS = {
        udyam: ['Udyam Registration Number', 'Enterprise Name', 'Type of Enterprise (Micro/Small/Medium)', 'Date of Registration', 'Major Activity (Manufacturing/Service/Trading)', 'Registration Type', 'Social Category', 'Constitution / Organisation Type', 'Date of Incorporation / Commencement'],
        gst: ['GSTIN', 'Legal Name of Business', 'Date of Registration'],
        pan: ['PAN Number', 'Name'],
        aadhaar: ['Aadhaar Number', 'Name'],
        cheque: ['Account Holder Name', 'Account Number', 'IFSC Code', 'Bank Name'],
        statement: ['Account Number', 'Bank Name', 'Statement Period (from-to dates)'],
        passbook: ['Account Number', 'Bank Name', 'Account Holder Name'],
        hotelInvoice: ['Hotel Name', 'Invoice Amount', 'Invoice Date', 'GSTIN (if shown)'],
        hotelPayment: ['Payee Name', 'Amount Paid', 'Payment Date'],
        travelExpense: ['Mode of Travel', 'Amount', 'Date'],
        travelInvoice: ['Travel Provider Name', 'Invoice Amount', 'Invoice Date'],
        courier: ['Courier Company', 'Amount', 'Date'],
        marketing: ['Vendor Name', 'Invoice Amount', 'Invoice Date'],
    };

    // A separate, MSME-specific prompt used only from the PMS claim document
    // upload flow (msmePmsSchemeController.js) — NOT used by the general
    // buildPrompt() moderation check that logos/team photos/other document
    // uploads across the app rely on, so this never changes their behavior.
    buildMsmeExtractionPrompt(documentType, documentName) {
        const fields = AiDocumentVerificationService.MSME_EXTRACT_FIELDS[documentType] || [];
        const fieldList = fields.length ? fields.map(f => `"${f}"`).join(', ') : '(no specific fields — just verify document type)';
        const fieldsExampleObj = fields.length
            ? `{ ${fields.map(f => `"${f}": "<value found in the document, or null if not visible>"`).join(', ')} }`
            : '{}';

        return `You are a document-verification and data-extraction system for an MSME government subsidy claim portal.

The uploaded file is supposed to be: "${documentName}".

Step 1 — Verify:
1. Does the image/document contain nudity, sexual content, or content involving a minor? -> issue "nudity" or "minor" (safety-critical, always report).
2. Does the file clearly fail to match the expected document type "${documentName}" (e.g. a random unrelated photo/screenshot instead of the real document)? -> issue "mismatch".
3. Is the file too blurry, blank, cropped, or low-quality to read? -> issue "unreadable".
4. If none of the above, it's valid.

Step 2 — Only if valid, extract these specific fields exactly as they appear on the document: ${fieldList}.
If a field isn't visible or the document type doesn't call for it, use null for that field. Do not guess or invent values.

Respond ONLY with valid JSON (no markdown fences, no extra text) in exactly this format:
{"valid": true, "issue": null, "reason": "short reason", "extractedDetails": ${fieldsExampleObj}}
or, if invalid:
{"valid": false, "issue": "nudity|minor|mismatch|unreadable", "reason": "short reason", "extractedDetails": null}`;
    }

    // Used only from the admin "Book a Stand" flow (verifyUdyamCertificateStandalone
    // in msmePmsSchemeController.js) — a live pre-booking eligibility read on a
    // freshly uploaded Udyam certificate, combined with the industry/sector and
    // company description the admin has already entered on the booking form.
    // Separate from buildMsmeExtractionPrompt (used post-booking for the actual
    // claim documents) so that flow's behavior never changes.
    buildMsmeEligibilityScreeningPrompt(documentName, context = {}) {
        const { industrySector, companyBrief, typeOfBusiness, validCategories } = context;
        const fields = AiDocumentVerificationService.MSME_EXTRACT_FIELDS.udyam;
        const fieldsExampleObj = `{ ${fields.map(f => `"${f}": "<value found in the document, or null if not visible>"`).join(', ')} }`;
        const categoryList = Array.isArray(validCategories) && validCategories.length
            ? validCategories.map(c => `"${c}"`).join(', ')
            : null;

        return `You are an eligibility-screening assistant for the MSME PMS reimbursement scheme at a trade exhibition, helping an admin quickly assess a Udyam Registration Certificate uploaded while booking a stand.

The uploaded file is supposed to be: "${documentName}".

Step 1 — Verify (safety-critical, always report first):
1. Nudity/sexual content or a minor -> issue "nudity" or "minor".
2. Clearly not a Udyam Registration Certificate -> issue "mismatch".
3. Too blurry/blank/cropped to read -> issue "unreadable".
4. Otherwise valid.

Step 2 — Only if valid, extract these fields exactly as they appear on the certificate: ${fields.map(f => `"${f}"`).join(', ')}. Use null for anything not visible — never invent values.

Step 3 — Only if valid, assess fit for the exhibition's MSME PMS scheme using BOTH the certificate and this context already entered on the booking form:
- Declared Industry/Sector: "${industrySector || 'Not provided'}"
- Company/About description: "${companyBrief || 'Not provided'}"
- Type of Business (legal structure): "${typeOfBusiness || 'Not provided'}"
${categoryList ? `\nThe exhibition only recognizes these Industry/Sector categories — "bestMatchingCategory" MUST be exactly one of: ${categoryList}.` : ''}

Return in a "screening" object:
- "categoryMatch": true if the certificate + description genuinely support the declared Industry/Sector, false if they clearly don't, null if you can't tell.
- "bestMatchingCategory": which of the allowed categories above actually fits this business best, based on the description — even if it's the same one that was declared.
- "nicCodeMatch": one or two plausible NIC 2008 activity codes for this business (e.g. "10795, 21009"), or null if you can't estimate one confidently.
- "riskLevel": "Low", "Medium", or "High" — verification risk for this reimbursement case (mismatched category, vague description, or a generic/unclear certificate = higher risk).
- "riskNote": one short sentence explaining the risk level.
- "recommendation": one of "PROCEED_WITH_PMS_APPLICATION", "NEEDS_REVIEW", "NOT_RECOMMENDED".

Respond ONLY with valid JSON (no markdown fences, no extra text) in exactly this format:
{"valid": true, "issue": null, "reason": "short reason", "extractedDetails": ${fieldsExampleObj}, "screening": {"categoryMatch": true, "bestMatchingCategory": "...", "nicCodeMatch": "...", "riskLevel": "Low", "riskNote": "...", "recommendation": "PROCEED_WITH_PMS_APPLICATION"}}
or, if invalid:
{"valid": false, "issue": "nudity|minor|mismatch|unreadable", "reason": "short reason", "extractedDetails": null, "screening": null}`;
    }
    async verifyDocument({ fileUrl, documentName, fileType, expectedGender, promptOverride }) {
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
                return await this.verifyWithGemini(base64, mimeType, documentName, apiKey, ai.geminiModel, expectedGender, promptOverride);
            }
            return await this.verifyWithOpenAI(base64, mimeType, documentName, apiKey, ai.openaiModel, expectedGender, promptOverride);
        } catch (err) {
            if (this.isQuotaError(err)) {
                console.error('AI document verification quota error:', err.message);
                return { skipped: true, reason: 'quota_exceeded', error: err.message };
            }
            console.error('AI document verification error:', err.message);
            return { skipped: true, reason: 'error' };
        }
    }

    async verifyWithGemini(base64, mimeType, documentName, apiKey, model, expectedGender, promptOverride) {
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
            { text: promptOverride || this.buildPrompt(documentName, expectedGender) }
        ]);

        const response = result.response;
        const blockReason = response.promptFeedback?.blockReason;
        const finishReason = response.candidates?.[0]?.finishReason;
        if (blockReason || finishReason === 'SAFETY') {
            const isCompanyLogo = String(documentName || '').trim().toLowerCase() === 'company logo';
            return {
                skipped: false,
                valid: false,
                issue: isCompanyLogo ? 'verification_blocked' : 'nudity',
                reason: isCompanyLogo
                    ? 'AI could not verify this image confidently. Please upload a clear company logo or brand image.'
                    : 'Flagged as inappropriate content by the AI provider\'s safety system.'
            };
        }

        return this.parseAiResponse(response.text());
    }

    async verifyWithOpenAI(base64, mimeType, documentName, apiKey, model, expectedGender, promptOverride) {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey });

        const response = await client.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: promptOverride || this.buildPrompt(documentName, expectedGender) },
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

    async generateAttendanceSummary({ scope, data }) {
        const ai = await this.getAiSettings();
        const provider = ai.provider || 'gemini';
        const apiKey = this.getDecryptedKey(ai, provider);
        if (!apiKey) {
            const error = new Error(`No ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key is saved in AI Verification Settings.`);
            error.status = 400;
            throw error;
        }
        const model = provider === 'openai' ? ai.openaiModel : ai.geminiModel;
        const prompt = `You are the official attendance insights assistant for IHWE exhibition administrators.
Create a concise, factual and useful ${scope} summary from the JSON data below.
Use clear headings and short bullet points. Highlight attendance across event days, important category/pass patterns,
and practical operational observations. For a person, summarize identity/profile and attendance only.
For a company, summarize company attendance plus unique member/pass participation.
For the exhibition, summarize visitors, buyers, exhibitors, companies and day-wise movement.
Never invent facts, percentages or recommendations unsupported by the supplied data. Do not expose database IDs.
Return plain text only, maximum 450 words.

DATA:
${JSON.stringify(data).slice(0, 120000)}`;
        try {
            if (provider === 'gemini') {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const genModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' });
                const result = await genModel.generateContent(prompt);
                return result.response.text().trim();
            }
            const OpenAI = require('openai');
            const client = new OpenAI({ apiKey });
            const response = await client.chat.completions.create({
                model: model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 900
            });
            return String(response.choices?.[0]?.message?.content || '').trim();
        } catch (error) {
            const wrapped = new Error(this.isQuotaError(error)
                ? `AI quota/rate limit reached: ${error.message}`
                : `AI summary failed: ${error.message}`);
            wrapped.status = this.isQuotaError(error) ? 429 : 502;
            throw wrapped;
        }
    }
}

module.exports = new AiDocumentVerificationService();
