const cron = require('node-cron');
const { expireStaleCalls } = require('../services/communicationCallService');

let task;

function initCommunicationCallCron(communicationIo) {
    if (task) return task;
    task = cron.schedule('*/15 * * * * *', () => {
        expireStaleCalls(communicationIo)
            .catch(error => console.error('Communication call expiry failed:', error.message));
    });
    return task;
}

module.exports = { initCommunicationCallCron };
