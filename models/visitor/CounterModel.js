const mongoose = require("mongoose");
const { secondaryDB } = require("../../config/secondaryDb");
const CounterSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  secondaryDB.models.VisitorCounter || secondaryDB.model("VisitorCounter", CounterSchema);

module.exports = Counter;
