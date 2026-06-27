const Counter = require('../models/cms/CounterModel');

const generateRegistrationId = async (type) => {
  const prefixMap = {
    corporate: "NGT/IHWE/CV",
    general: "NGT/IHWE/GV",
    healthCamp: "NGT/IHWE/HV",
    group: "NGT/IHWE/GRP",
  };

  const prefix = prefixMap[type];
  if (!prefix) throw new Error(`Unknown visitor type: ${type}`);

  // Atomically increment counter
  const counter = await Counter.findOneAndUpdate(
    { type },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );
  // const paddedSeq = String(counter.seq).padStart(6, '0');
  // return `${prefix}/${paddedSeq}`;
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const seriesNum = counter.seq > 100000 ? (counter.seq % 100000) : counter.seq;
  const paddedSeq = String(seriesNum).padStart(4, '0');

  return `${prefix}/${currentYear}/${paddedSeq}`;
};

module.exports = { generateRegistrationId };
