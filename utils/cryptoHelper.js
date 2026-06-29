const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.AI_SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET || 'ihwe_secret_2026';
const KEY = crypto.createHash('sha256').update(SECRET).digest();
function encrypt(plainText) {
    if (!plainText) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
    if (!payload) return '';
    const parts = payload.split(':');
    if (parts.length !== 3) return payload;

    try {
        const [ivHex, tagHex, dataHex] = parts;
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        return payload;
    }
}

module.exports = { encrypt, decrypt };
