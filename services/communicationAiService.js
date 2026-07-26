const { GoogleGenerativeAI } = require('@google/generative-ai');
const Settings = require('../models/Settings');
const { decrypt } = require('../utils/cryptoHelper');

const restrictedRules = [
    {
        reason: 'approval-or-status-change',
        pattern: /\b(approve|reject|activate|deactivate|verify)\b|\b(change|update|set)\s+(the\s+)?(status|approval)\b/i
    },
    {
        reason: 'attendance-change',
        pattern: /\battendance\s*(mark|add|remove|delete|correct|edit|change|update)\b|\b(mark|add|remove|delete|correct|edit|change|update)\s+(my\s+|the\s+|their\s+)?attendance\b/i
    },
    {
        reason: 'access-or-security-change',
        pattern: /\b(grant|give|change|update|remove|reset)\s+(my\s+|the\s+|their\s+)?(permission|access|password|role)\b|\b(make|promote)\s+me\s+(an?\s+)?admin\b|\b(otp|password|secret|api\s*key|token)\b/i
    },
    {
        reason: 'financial-action',
        pattern: /\b(payment|refund|bank|financial|invoice|paid\s+amount|received\s+amount)\b/i
    },
    {
        reason: 'destructive-action',
        pattern: /\b(delete|remove)\s+(the\s+|my\s+|this\s+|that\s+)?(user|account|record|profile)\b/i
    },
    {
        reason: 'prompt-injection',
        pattern: /\b(ignore|forget|override|bypass)\s+(all\s+|the\s+|your\s+|previous\s+)?(rules|instructions|prompt|security)\b|\b(reveal|show|print)\s+(the\s+|your\s+)?(system\s+prompt|secret|api\s*key|token)\b/i
    }
];

function classifyRequest(question) {
    const text = String(question || '').trim();
    const match = restrictedRules.find(rule => rule.pattern.test(text));
    return match ? { restricted: true, reason: match.reason } : { restricted: false, reason: 'informational' };
}

function escalation(reason) {
    return {
        text: 'This request needs Super Administrator approval. I have kept it in the conversation for human review and will not make any account, attendance, status, access, security, or financial change.',
        escalated: true,
        reason
    };
}

function sanitizeGeneratedReply(text) {
    const value = String(text || '').trim().slice(0, 5000);
    if (!value) return null;
    const unsafeCommitment = /\b(i|we)\s+(have\s+|already\s+)?(approved|rejected|activated|deactivated|changed|updated|deleted|removed|refunded|paid|granted|reset)\b/i;
    const sensitiveDisclosure = /\b(api\s*key|password|one[-\s]?time\s+password|access\s+token)\s*(is|:)\s*\S+/i;
    return unsafeCommitment.test(value) || sensitiveDisclosure.test(value)
        ? escalation('unsafe-generated-response')
        : { text: value, escalated: false, reason: 'gemini' };
}

async function generateReply({ employeeName, question, recentMessages, event }) {
    const classification = classifyRequest(question);
    if (classification.restricted) return escalation(classification.reason);

    const settings = await Settings.findOne().sort({ createdAt: 1 }).lean();
    const ai = settings?.aiVerification || {};
    const apiKey = decrypt(ai.geminiApiKey);
    if (!ai.isEnabled || !apiKey) return null;

    const history = recentMessages
        .slice(-8)
        .map(item => `${item.senderRole}: ${String(item.text || '').slice(0, 500)}`)
        .join('\n');
    const prompt = `You are the IHWE Operations Assistant helping an authenticated employee while the Super Administrator is unavailable.

Rules:
- Reply in concise professional Hinglish matching the employee's language.
- You may explain event operations, attendance scanning, visitor/buyer/exhibitor handling, scanner troubleshooting, stalls, and escalation steps.
- Never claim to approve/reject users, edit/remove attendance, change permissions, expose private employee data, or make financial/official commitments.
- If information is missing or an action requires authority, clearly say it is escalated to the Super Administrator.
- Do not invent event facts.
- Prefix nothing; the app visibly labels the message as AI Assistant.

Event context: ${event?.name || 'IHWE'}; dates: ${(event?.days || []).join(', ') || 'not available'}; location: ${event?.location || 'not available'}.
Employee: ${employeeName || 'Employee'}
Recent conversation:
${history || 'No earlier messages'}

Employee question: ${question}

Return only the reply text.`;

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: ai.geminiModel || 'gemini-2.5-flash'
    });
    try {
        const response = await model.generateContent(prompt);
        return sanitizeGeneratedReply(response.response.text());
    } catch (error) {
        console.error('Communication Gemini request failed:', error.message);
        return escalation('ai-unavailable');
    }
}

module.exports = { generateReply, classifyRequest, sanitizeGeneratedReply };
