const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.user_role },
    process.env.JWT_SECRET || "your_secret_key",
    { expiresIn: "3h" },
  );
};

module.exports = generateToken;
