const mongoose = require("mongoose");

const secondaryDB = mongoose.createConnection(process.env.MONGO_URI_SECONDARY);

secondaryDB.on("connected", () =>
  console.log("✅ SECONDARY MongoDB connected"),
);
secondaryDB.on("error", (err) => console.error("❌ SECONDARY DB error:", err));
module.exports = {
  secondaryDB,
};
