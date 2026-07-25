const assert = require('node:assert/strict');
const { signPassQr, verifyPassQr } = require('../utils/passQrToken');

const payload = JSON.parse(signPassQr({
    reqId: '66abcdef1234567890abcdef',
    type: 'lunch',
    index: 0,
    version: 3
}));

assert.equal(verifyPassQr(payload), true, 'fresh signed QR should verify');
assert.equal(verifyPassQr({ ...payload, type: 'vehicle' }), false, 'altered pass type must fail');
assert.equal(verifyPassQr({ ...payload, version: 2 }), false, 'altered QR version must fail');
assert.equal(verifyPassQr({ ...payload, index: 1 }), false, 'altered holder index must fail');
assert.equal(verifyPassQr({ reqId: payload.reqId, type: payload.type, index: 0, version: 3 }), false, 'unsigned QR must fail');

console.log('passQrToken.unit: signed, tampered, versioned and unsigned scenarios passed');
