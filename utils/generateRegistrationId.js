const Counter = require("../models/visitor/CounterModel.js");

const generateRegistrationId = async (type) => {
  const prefixMap = {
    corporate: "NGT/IHWE/CV",
    general: "NGT/IHWE/GV",
    healthCamp: "NGT/IHWE/HV",
  };

  const prefix = prefixMap[type];
  if (!prefix) throw new Error(`Unknown visitor type: ${type}`);

  // ✅ Counter atomically increment karo
  const counter = await Counter.findOneAndUpdate(
    { type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  // ✅ Ensure counter starts at 100001 if it's currently low
  if (counter.seq < 100001) {
    const updatedCounter = await Counter.findOneAndUpdate(
      { type },
      { $set: { seq: 100001 } },
      { new: true }
    );
    counter.seq = updatedCounter.seq;
  }

  // ✅ 100001, 100002... format
  const paddedSeq = String(counter.seq);
  return `${prefix}/${paddedSeq}`;
};

module.exports = { generateRegistrationId };
