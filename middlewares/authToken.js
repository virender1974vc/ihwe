const jwt = require("jsonwebtoken");

const JWT_SECRETS = [
  process.env.JWT_SECRET,
  "fallback_secret_key",
  "ihwe_secret_2026",
  "your_jwt_secret",
].filter(Boolean);

exports.authToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    let decoded;
    for (const secret of JWT_SECRETS) {
      try {
        decoded = jwt.verify(token, secret);
        break;
      } catch (_) {}
    }
    if (!decoded) {
      throw new Error("Invalid or expired token");
    }
    req.user = decoded; // user info available in req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
