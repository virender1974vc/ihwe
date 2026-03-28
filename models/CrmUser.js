const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { secondaryDB } = require("../config/secondaryDb");
const CrmUserSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true },
    user_password: { type: String, required: true },
    user_email: { type: String, required: true, unique: true },
    user_mobile: { type: String, required: true, unique: true },
    user_fullname: { type: String, required: true },
    user_role: {
      type: String,
      default: "Admin",
      required: true,
      trim: true,
      enum: ["Admin", "User", "SuperAdmin", "Accountant"],
    },
    user_designation: { type: String, required: true },
    user_dept: { type: String, required: true },
    user_status: {
      type: String,
      required: true,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
    user_expo_category: { type: String, required: true },
    user_last_login: { type: Date, required: true },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },
    otp: { type: String, default: null },
    otp_expires_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "user_added", updatedAt: "user_updated" } },
);

// Hash password before saving
CrmUserSchema.pre("save", async function (next) {
  // Only hash password if it's modified and is not already hashed
  if (!this.isModified("user_password")) return next();

  try {
    if (
      !this.user_password.startsWith("$2a$") &&
      !this.user_password.startsWith("$2b$")
    ) {
      const salt = await bcrypt.genSalt(10);
      this.user_password = await bcrypt.hash(this.user_password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
CrmUserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.user_password);
};

module.exports = secondaryDB.model("CrmUser", CrmUserSchema);
