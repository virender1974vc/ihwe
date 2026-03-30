const mongoose = require("mongoose");
const { secondaryDB } = require("../config/secondaryDb");
const LoginUserSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true },
    user_password: { type: String, required: true },
    token: { type: String, default: null },
    exp_token: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = secondaryDB.model("LoginUser", LoginUserSchema);
