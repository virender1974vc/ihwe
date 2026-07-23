const mongoose = require('mongoose');
const Call = require('../models/CommunicationCall');
const Audit = require('../models/CommunicationAudit');

const DEFAULT_RING_TIMEOUT_SECONDS = 45;

function ringTimeoutSeconds() {
    const configured = Number(process.env.COMMUNICATION_CALL_RING_TIMEOUT_SECONDS);
    return Number.isFinite(configured) && configured >= 15 && configured <= 180
        ? Math.round(configured)
        : DEFAULT_RING_TIMEOUT_SECONDS;
}

async function expireStaleCalls(communicationIo, now = new Date()) {
    if (mongoose.connection.readyState !== 1) return [];
    const cutoff = new Date(now.getTime() - ringTimeoutSeconds() * 1000);
    const stale = await Call.find({
        status: 'ringing',
        startedAt: { $lte: cutoff }
    }).select('_id').lean();
    const expired = [];

    for (const row of stale) {
        const call = await Call.findOneAndUpdate(
            { _id: row._id, status: 'ringing' },
            {
                $set: {
                    status: 'missed',
                    endedAt: now,
                    endReason: 'no-answer'
                }
            },
            { returnDocument: 'after' }
        ).lean();
        if (!call) continue;
        expired.push(call);
        await Audit.create({
            conversationId: call.conversationId,
            actorId: call.callerId,
            actorName: 'Communication system',
            actorRole: 'system',
            action: 'call-missed',
            after: { callId: call._id, type: call.type, reason: 'no-answer' }
        });
        const payload = { ...call, event: 'missed' };
        communicationIo?.to(`user:${call.callerId}`).emit('call:ended', payload);
        communicationIo?.to(`user:${call.calleeId}`).emit('call:ended', payload);
    }
    return expired;
}

module.exports = {
    expireStaleCalls,
    ringTimeoutSeconds
};
