const aiDocumentVerificationService = require('../services/aiDocumentVerificationService');
const { encrypt, decrypt } = require('../utils/cryptoHelper');

function maskKey(key) {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

class AiVerificationSettingsController {
    async getSettings(req, res) {
        try {
            const settings = await aiDocumentVerificationService.getSettingsDoc();
            const ai = settings.aiVerification.toObject();
            const data = {
                ...ai,
                hasGeminiKey: !!ai.geminiApiKey,
                hasOpenaiKey: !!ai.openaiApiKey,
                geminiApiKey: maskKey(decrypt(ai.geminiApiKey)),
                openaiApiKey: maskKey(decrypt(ai.openaiApiKey))
            };
            res.json({ success: true, data });
        } catch (error) {
            console.error('Fetch AI verification settings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async updateSettings(req, res) {
        try {
            const { provider, isEnabled, geminiApiKey, geminiModel, openaiApiKey, openaiModel } = req.body;
            const settings = await aiDocumentVerificationService.getSettingsDoc();
            const ai = settings.aiVerification;

            if (provider) ai.provider = provider;
            if (geminiModel) ai.geminiModel = geminiModel;
            if (openaiModel) ai.openaiModel = openaiModel;

            // Only overwrite a key when the admin actually typed a new one (masked values are never resent).
            if (geminiApiKey) ai.geminiApiKey = encrypt(geminiApiKey);
            if (openaiApiKey) ai.openaiApiKey = encrypt(openaiApiKey);

            if (isEnabled !== undefined) {
                const enabling = !!isEnabled;
                if (enabling) {
                    const finalProvider = provider || ai.provider;
                    const hasKey = finalProvider === 'openai' ? !!ai.openaiApiKey : !!ai.geminiApiKey;
                    if (!hasKey) {
                        return res.status(400).json({
                            success: false,
                            message: `Please add and save a ${finalProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key before enabling verification.`
                        });
                    }
                }
                ai.isEnabled = enabling;
            }

            await settings.save();
            res.json({ success: true, message: 'AI verification settings updated successfully' });
        } catch (error) {
            console.error('Update AI verification settings error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async testConnection(req, res) {
        try {
            const { provider, model } = req.body;
            const settings = await aiDocumentVerificationService.getSettingsDoc();

            // If the admin didn't type a fresh key (masked values are never resent), fall back
            // to whichever key is already saved for the selected provider.
            const savedKey = provider === 'openai' ? settings.aiVerification.openaiApiKey : settings.aiVerification.geminiApiKey;
            const apiKey = req.body.apiKey || decrypt(savedKey);

            const result = await aiDocumentVerificationService.testConnection({ provider, apiKey, model });

            settings.aiVerification.lastTestedAt = new Date();
            settings.aiVerification.lastTestResult = result.success ? 'success' : 'failed';
            await settings.save();

            res.json(result);
        } catch (error) {
            console.error('AI test connection error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    async testDocumentVerification(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please choose an image to test' });
            }

            const { documentName, provider, apiKey, model, expectedGender } = req.body;
            const result = await aiDocumentVerificationService.testImageVerification({
                buffer: req.file.buffer,
                mimeType: req.file.mimetype,
                documentName: documentName || 'Test Document',
                provider,
                apiKey,
                model,
                expectedGender: expectedGender || undefined
            });

            res.json({ success: true, result });
        } catch (error) {
            console.error('AI test document verification error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = new AiVerificationSettingsController();
