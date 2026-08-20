const Counter = require("../models/visitor/CounterModel.js");

const generateRegistrationId = async (type, eventName = '') => {
  const isBOE = eventName && String(eventName).toUpperCase().includes('BOE');
  const orgPrefix = isBOE ? 'BOE' : 'IHWE';

  const prefixMap = {
    corporate: `NGT/${orgPrefix}/CV`,
    general: `NGT/${orgPrefix}/GV`,
    healthCamp: `NGT/${orgPrefix}/HV`,
    group: `NGT/${orgPrefix}/GRP`,
    international: `NGT/${orgPrefix}/IV`,
  };

  const prefix = prefixMap[type];
  if (!prefix) throw new Error(`Unknown visitor type: ${type}`);

  // Use a separate counter type for BOE to isolate sequence numbers
  const counterType = isBOE ? `${type}_BOE` : type;

  // Atomically increment counter
  const counter = await Counter.findOneAndUpdate(
    { type: counterType },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );

  const currentYear = new Date().getFullYear().toString().slice(-2);
  const seriesNum = counter.seq > 100000 ? (counter.seq % 100000) : counter.seq;
  const paddedSeq = String(seriesNum).padStart(4, '0');

  return `${prefix}/${currentYear}/${paddedSeq}`;
};

module.exports = { generateRegistrationId };
