// const mongoose = require("mongoose");

// const CounterSchema = new mongoose.Schema({
//   type: { type: String, required: true, unique: true },
//   seq: { type: Number, default: 0 },
// });

// export default mongoose.model("Counter", CounterSchema);
const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const CounterSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  secondaryDB.models.Counter || secondaryDB.model("Counter", CounterSchema);

module.exports = Counter;
