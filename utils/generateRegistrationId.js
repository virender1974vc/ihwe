const Counter = require("../models/visitor/CounterModel.js");

const generateRegistrationId = async (type) => {
  const prefixMap = {
    corporate: "NGT/IHWE/CV",
    general: "NGT/IHWE/GV",
    healthCamp: "NGT/IHWE/HV",
  };

  const prefix = prefixMap[type];
  if (!prefix) throw new Error(`Unknown visitor type: ${type}`);

  // Atomically increment counter
  const counter = await Counter.findOneAndUpdate(
    { type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `${prefix}/${paddedSeq}`;
};

module.exports = { generateRegistrationId };
