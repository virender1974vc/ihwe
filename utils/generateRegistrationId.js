const Counter = require("../models/visitor/CounterModel.js");

const generateRegistrationId = async (type) => {
  const prefixMap = {
    corporate: "NGT/OE/CV",
    general: "NGT/IH&WE/GV",
    healthCamp: "NGT/IH&WE/HV",
  };

  const prefix = prefixMap[type];
  if (!prefix) throw new Error(`Unknown visitor type: ${type}`);

  // ✅ Counter atomically increment karo
  const counter = await Counter.findOneAndUpdate(
    { type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  // ✅ 001, 002, 003... format
  const paddedSeq = String(counter.seq).padStart(3, "0");
  return `${prefix}/${paddedSeq}`;
};

module.exports = { generateRegistrationId };
