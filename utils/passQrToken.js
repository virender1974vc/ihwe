const crypto = require('crypto');

const secret = () => {
    const value = process.env.PASS_QR_SECRET || process.env.JWT_SECRET;
    if (value) return value;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('PASS_QR_SECRET or JWT_SECRET is required in production.');
    }
    return 'local-development-pass-qr-secret';
};
const canonical = ({ reqId, type, index, version }) =>
    `${String(reqId)}|${String(type)}|${Number(index)}|${Number(version || 1)}`;

function signPassQr(payload) {
    const data = {
        reqId: String(payload.reqId),
        type: String(payload.type),
        index: Number(payload.index),
        version: Number(payload.version || 1)
    };
    data.signature = crypto.createHmac('sha256', secret())
        .update(canonical(data))
        .digest('base64url');
    return JSON.stringify(data);
}

function verifyPassQr(payload) {
    const signature = String(payload?.signature || '');
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', secret())
        .update(canonical(payload))
        .digest('base64url');
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = { signPassQr, verifyPassQr };
